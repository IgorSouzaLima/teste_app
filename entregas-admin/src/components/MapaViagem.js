// src/components/MapaViagem.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { collection, onSnapshot, orderBy, query, doc, onSnapshot as onDocSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícones customizados
const truckIcon = new L.DivIcon({
  html: `<div style="background:#185FA5;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
  className: ''
});
const destIcon = new L.DivIcon({
  html: `<div style="background:#E24B4A;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
  className: ''
});

function RecenterMap({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, map.getZoom()); }, [pos, map]);
  return null;
}

function FitTrail({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 12));
      return;
    }
    map.fitBounds(points, { padding: [28, 28] });
  }, [map, points]);
  return null;
}

const fmtHora = (value) => {
  if (!value) return 'Horario indisponivel';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MapaViagem({ viagemId }) {
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [viagem, setViagem] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Dados da viagem
    const unsubViagem = onDocSnapshot(doc(db, 'viagens', viagemId), snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setViagem(data);
        const atual = data.localizacaoAtual;
        if (atual?.lat != null && atual?.lng != null) {
          setPosicaoAtual([atual.lat, atual.lng]);
        }
      }
    });

    // Histórico de localizações
    const qLoc = query(
      collection(db, 'viagens', viagemId, 'localizacoes'),
      orderBy('timestamp', 'asc')
    );
    const unsubLoc = onSnapshot(
      qLoc,
      snap => {
        const locs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(l => l.lat != null && l.lng != null);
        setHistorico(locs);
        if (locs.length > 0) {
          const ultima = locs[locs.length - 1];
          setPosicaoAtual([ultima.lat, ultima.lng]);
        }
        setErro('');
      },
      () => setErro('Nao foi possivel carregar o rastreamento desta viagem.')
    );

    return () => { unsubViagem(); unsubLoc(); };
  }, [viagemId]);

  const trilha = historico.map((ponto) => [ponto.lat, ponto.lng]);
  const center = posicaoAtual || [-21.5, -45.4]; // fallback: sul de MG

  return (
    <div className="map-container">
      {erro && (
        <div style={{ padding: 12, color: 'var(--danger)' }}>{erro}</div>
      )}
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <FitTrail points={trilha.length ? trilha : (posicaoAtual ? [posicaoAtual] : [])} />
        {posicaoAtual && (
          <>
            <RecenterMap pos={posicaoAtual} />
            <Marker position={posicaoAtual} icon={truckIcon}>
              <Popup>
                <strong>{viagem?.motoristaNome}</strong><br/>
                {viagem?.motoristaPlaca}<br/>
                Última atualização GPS
              </Popup>
            </Marker>
          </>
        )}
        {trilha.length > 1 && (
          <Polyline positions={trilha} color="#185FA5" weight={4} opacity={0.7} />
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
                color: isUltimo ? '#185FA5' : (isPrimeiro ? '#2E7D32' : '#6F7D8C'),
                fillColor: isUltimo ? '#185FA5' : (isPrimeiro ? '#2E7D32' : '#AAB4BE'),
                fillOpacity: isUltimo ? 0.95 : 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <strong>
                  {isUltimo ? 'Posicao atual' : (isPrimeiro ? 'Inicio do rastreio' : `Ponto ${index + 1}`)}
                </strong>
                <br />
                Atualizado em {fmtHora(ponto.timestamp)}
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
  );
}
