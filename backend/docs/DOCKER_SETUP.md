# Docker & RabbitMQ Setup Guide (Linux)

Since you've decided to go with Docker (excellent choice!), follow these steps to get everything running.

---

## Phase 1: Install Docker on Linux (Ubuntu/Debian)

If you already have Docker, skip to Phase 2.

### 1. Remove old versions (if any)
```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

### 2. Install using the convenience script
This is the fastest way on Linux.
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 3. Add your user to the docker group
This lets you run docker commands without `sudo`. **You must log out and back in after this.**
```bash
sudo usermod -aG docker $USER
```

### 4. Verify Installation
```bash
docker --version
docker compose version
```

---

## Phase 2: Run RabbitMQ with Delayed Plugin

The easiest way to get RabbitMQ with the plugin is to use a pre-built image or build one using `docker-compose`.

### 1. Create a `docker-compose.yml` file
Create this in your project root or backend folder.
(I have created this file for you in `backend/docker-compose.yml`)

### 2. Start RabbitMQ
```bash
cd backend
docker compose up -d
```

### 3. Verify the Plugin
```bash
docker exec -it rabbitmq rabbitmq-plugins list | grep delayed
```
You should see: `[E*] rabbitmq_delayed_message_exchange`

---

## Accessing the Dashboard

1. Go to: `http://localhost:15672`
2. Username: `guest`
3. Password: `guest`

You can now see your exchanges and queues visually!
