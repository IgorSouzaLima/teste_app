// src/components/MapaAoVivo.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
          .map(d => d.data())
          .filter(l => l.lat != null && l.lng != null);

        setHistorico(locs.map(l => [l.lat, l.lng]));

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
          {historico.length > 1 && (
            <Polyline
              positions={historico}
              color="#185FA5"
              weight={3}
              opacity={0.55}
              dashArray="6 4"
            />
          )}
        </MapContainer>
      </div>

      {posicaoAtual ? (
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, textAlign: 'center' }}>
          <span className="live-dot" />
          Posição atualizada às {fmtHora(atualizadoEm)} · atualiza a cada 10 segundos
        </p>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, textAlign: 'center' }}>
          Aguardando primeira atualização de localização...
        </p>
      )}
    </div>
  );
}
