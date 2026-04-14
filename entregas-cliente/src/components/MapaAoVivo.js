// src/components/MapaAoVivo.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const truckIcon = new L.DivIcon({
  html: `<div style="
    background:#185FA5; width:18px; height:18px; border-radius:50%;
    border:3px solid white; box-shadow:0 2px 8px rgba(24,95,165,0.5);
    animation:pulse 1.5s ease-in-out infinite;
  "></div>
  <style>@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(24,95,165,0.4)}50%{box-shadow:0 0 0 8px rgba(24,95,165,0)}}</style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

function AutoCenter({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, Math.max(map.getZoom(), 11), { animate: true });
  }, [pos, map]);
  return null;
}

function FitTrail({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 12), { animate: true });
      return;
    }
    map.fitBounds(points, { padding: [28, 28] });
  }, [map, points]);
  return null;
}

export default function MapaAoVivo({ viagemId, motoristaNome }) {
  const [historico, setHistorico] = useState([]);
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const unsubViagem = onSnapshot(
      doc(db, 'viagens', viagemId),
      (snap) => {
        if (!snap.exists()) return;
        const atual = snap.data()?.localizacaoAtual;
        if (atual?.lat != null && atual?.lng != null) {
          setPosicaoAtual([atual.lat, atual.lng]);
          const atualizado = atual.atualizadoEm?.toDate?.() || null;
          if (atualizado) {
            setAtualizadoEm(atualizado);
          }
        }
      },
      () => {
        setErro('Nao foi possivel atualizar a viagem em tempo real.');
      }
    );

    const q = query(
      collection(db, 'viagens', viagemId, 'localizacoes'),
      orderBy('timestamp', 'asc')
    );

    const unsubLoc = onSnapshot(
      q,
      (snap) => {
        const locs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => l.lat != null && l.lng != null);

        setHistorico(locs);

        if (locs.length > 0) {
          const ultima = locs[locs.length - 1];
          setPosicaoAtual([ultima.lat, ultima.lng]);
          if (ultima.timestamp?.toDate) {
            setAtualizadoEm(ultima.timestamp.toDate());
          }
        }
        setErro('');
      },
      () => {
        setHistorico([]);
        setErro('Nao foi possivel carregar o rastreamento agora.');
      }
    );

    return () => {
      unsubViagem();
      unsubLoc();
    };
  }, [viagemId]);

  const center = posicaoAtual ?? [-21.5, -45.4];

  const fmtHora = (d) => {
    if (!d) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const fmtDataHora = (value) => {
    if (!value) return 'Horario indisponivel';
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const trilha = historico.map((ponto) => [ponto.lat, ponto.lng]);

  return (
    <div>
      {erro && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 0, marginBottom: 8, textAlign: 'center' }}>
          {erro}
        </p>
      )}
      <div className="map-wrap">
        <MapContainer
          center={center} zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <FitTrail points={trilha.length ? trilha : (posicaoAtual ? [posicaoAtual] : [])} />
          {posicaoAtual && (
            <>
              <AutoCenter pos={posicaoAtual} />
              <Marker position={posicaoAtual} icon={truckIcon}>
                <Popup>
                  <strong>{motoristaNome}</strong><br />
                  Atualizado às {fmtHora(atualizadoEm)}
                </Popup>
              </Marker>
            </>
          )}
          {trilha.length > 1 && (
            <Polyline
              positions={trilha}
              color="#185FA5"
              weight={4}
              opacity={0.7}
            />
          )}
          {historico.map((ponto, index) => {
            const isUltimo = index === historico.length - 1;
            const isPrimeiro = index === 0;
            return (
              <CircleMarker
                key={ponto.id || `${ponto.lat}-${ponto.lng}-${index}`}
                center={[ponto.lat, ponto.lng]}
                radius={isUltimo ? 6 : 4}
                pathOptions={{
                  color: isUltimo ? '#185FA5' : (isPrimeiro ? '#2E7D32' : '#7D8A97'),
                  fillColor: isUltimo ? '#185FA5' : (isPrimeiro ? '#2E7D32' : '#B9C3CC'),
                  fillOpacity: isUltimo ? 0.95 : 0.82,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>
                    {isUltimo ? 'Posicao atual' : (isPrimeiro ? 'Inicio do trajeto' : `Ponto ${index + 1}`)}
                  </strong>
                  <br />
                  Atualizado em {fmtDataHora(ponto.timestamp)}
                  <br />
                  Lat: {ponto.lat.toFixed(5)} | Lng: {ponto.lng.toFixed(5)}
                  <br />
                  Velocidade: {ponto.velocidade ?? 0} km/h
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {posicaoAtual ? (
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, textAlign: 'center' }}>
          <span className="live-dot" />
          Posicao atualizada as {fmtHora(atualizadoEm)} · rastro salvo a cada 1 minuto
        </p>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, textAlign: 'center' }}>
          Aguardando primeira atualização de localização...
        </p>
      )}
    </div>
  );
}
