# Pulse — Real-time Analytics Dashboard

A portfolio-ready demo of a Node.js event-streaming service with a live browser dashboard, Docker image, and Kubernetes manifests. It generates simulated user activity every 1.2 seconds and streams events to connected browsers with Socket.IO.

> **Demo limitation:** events and metrics are held in application memory. They reset when the container restarts and are not shared between replicas. The included two-replica Kubernetes manifest is for demonstrating deployment mechanics, not horizontally consistent production analytics. For production, use a shared event broker (such as Kafka or Redis Streams), persistent storage, authentication, and aggregation outside individual app processes.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm start
```

Open http://localhost:3000. Health check: http://localhost:3000/health.

## Send a sample event

```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user_demo","type":"purchase","page":"/checkout","country":"US","value":49.99}'
```

Read the latest event window at `GET /api/events` and aggregate metrics at `GET /api/summary`.

## Build and run with Docker

```bash
docker build -t analytics-dashboard:1.0.0 .
docker run --rm -p 3000:3000 --name analytics-dashboard analytics-dashboard:1.0.0
```

Open http://localhost:3000. In another terminal:

```bash
docker logs -f analytics-dashboard
docker ps
```

## Deploy to Kubernetes

The manifests use a local image name. With Docker Desktop Kubernetes, build the image locally first. With kind, load it into the cluster using `kind load docker-image analytics-dashboard:1.0.0`.

```bash
docker build -t analytics-dashboard:1.0.0 .
kubectl apply -f k8s/
kubectl get deployments,pods,services
kubectl rollout status deployment/analytics-dashboard
```

Open the dashboard using `http://localhost:30080` when using Docker Desktop Kubernetes. For kind/minikube, use the appropriate port-forward or service access method:

```bash
kubectl port-forward service/analytics-dashboard 3000:80
```

Then open http://localhost:3000.

Useful troubleshooting commands:

```bash
kubectl get pods -l app=analytics-dashboard
kubectl describe deployment analytics-dashboard
kubectl logs deployment/analytics-dashboard
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Suggested 3–5 minute portfolio recording

1. Show the dashboard and explain the live event feed, unique-user count, purchase count, and demo revenue.
2. Trigger a custom purchase using the `curl` command and point out the live update.
3. Show `Dockerfile`, build the image, run the container, and inspect `docker logs`.
4. Apply the Kubernetes manifests; show the Deployment, two Pods, Service, readiness/liveness probes, and resource requests/limits.
5. Explain the architecture and the in-memory/multi-replica limitation honestly. Describe Kafka/Redis Streams plus a database as the next production-hardening steps.

## Architecture

Browser dashboard ← Socket.IO/WebSocket → Node.js + Express API → demo event generator

Docker packages the app. Kubernetes Deployment runs two replicas and a Service exposes port 80 → container port 3000.
