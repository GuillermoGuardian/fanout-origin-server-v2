# Fanout Origin Server

Servidor origin minimalista para [Fastly Fanout](https://docs.fastly.com/products/fanout). Su único trabajo es responder con headers GRIP para que Fanout mantenga las conexiones SSE abiertas y suscriba a los clientes a los canales correctos.

## Cómo funciona

```
Cliente → Fastly Edge (Fanout) → Este servidor
                ↑
        Publisher externo
   (POST /publish/ al API de Fastly)
```

1. El cliente abre una conexión SSE al edge de Fastly.
2. Fastly reenvía la request a este servidor.
3. El servidor responde con headers GRIP (`Grip-Hold: stream`, `Grip-Channel: <canal>`).
4. Fastly mantiene la conexión abierta con el cliente.
5. Cualquier sistema externo publica eventos al API de Fastly y Fanout los entrega a todos los clientes suscritos.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/stream/live` | Suscribe al canal `live-scores` |
| `GET` | `/stream/match/:matchId` | Suscribe al canal `match-<matchId>` |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `FASTLY_SERVICE_ID` | ID del servicio Fastly |
| `FASTLY_API_TOKEN` | Token de la API de Fastly |
| `NODE_ENV` | `production` para modo Fastly, cualquier otro valor para modo local (Pushpin) |
| `PORT` | Puerto del servidor (Railway lo asigna automáticamente) |

## Desarrollo local

Requiere [Pushpin](https://pushpin.org/) corriendo en `localhost:5561`.

```bash
npm install
npm run dev
```

## Despliegue en Railway

```bash
railway login
railway link
railway up
```

## Publicar eventos

```bash
curl -X POST https://api.fastly.com/service/$FASTLY_SERVICE_ID/publish/ \
  -H "Authorization: Bearer $FASTLY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "channel": "live-scores",
      "formats": {
        "http-stream": {
          "content": "event: goal\ndata: {\"team\":\"Real Madrid\",\"minute\":42}\n\n"
        }
      }
    }]
  }'
```
