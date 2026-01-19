# RabbitMQ Local Setup Guide (Linux/Ubuntu - No Docker)

This guide walks you through installing RabbitMQ and the **Delayed Message Exchange Plugin** directly on your Linux machine (Ubuntu/Debian) without using Docker.

---

## Phase 1: Install RabbitMQ Server (Robust Fix for Ubuntu 24.04 Noble)

The automated scripts are failing on your system. We will manually add the official repositories to ensure Erlang 26+ and RabbitMQ are installed correctly.

### 1. Completely Purge Broken Packages
First, let's clean the slate to avoid conflicts:
```bash
sudo apt purge -y rabbitmq-server erlang*
sudo apt autoremove -y
sudo rm -f /etc/apt/sources.list.d/rabbitmq*
```

### 2. Add Official RabbitMQ GPG Keys
```bash
sudo apt update && sudo apt install -y curl gnupg
curl -1sLf "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" | sudo gpg --dearmor -o /usr/share/keyrings/rabbitmq.debian.gpg
curl -1sLf "https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-erlang.6026DFCA.key" | sudo gpg --dearmor -o /usr/share/keyrings/rabbitmq.erlang.gpg
```

### 3. Add the Repositories Manually
Copy and paste this entire block:
```bash
# Add RabbitMQ & Erlang repositories for Ubuntu Noble
sudo tee /etc/apt/sources.list.d/rabbitmq.list <<EOF
deb [signed-by=/usr/share/keyrings/rabbitmq.erlang.gpg] https://ppa1.rabbitmq.com/rabbitmq/rabbitmq-erlang/deb/ubuntu noble main
deb-src [signed-by=/usr/share/keyrings/rabbitmq.erlang.gpg] https://ppa1.rabbitmq.com/rabbitmq/rabbitmq-erlang/deb/ubuntu noble main

deb [signed-by=/usr/share/keyrings/rabbitmq.debian.gpg] https://ppa1.rabbitmq.com/rabbitmq/rabbitmq-server/deb/ubuntu noble main
deb-src [signed-by=/usr/share/keyrings/rabbitmq.debian.gpg] https://ppa1.rabbitmq.com/rabbitmq/rabbitmq-server/deb/ubuntu noble main
EOF
```

### 4. Install Erlang and RabbitMQ
Now update and install. These specific versions inside the repo will match perfectly:
```bash
sudo apt update
sudo apt install -y erlang-base erlang-asn1 erlang-crypto erlang-eldap erlang-ftp erlang-inets erlang-mnesia erlang-os-mon erlang-parsetools erlang-public-key erlang-runtime-tools erlang-snmp erlang-ssl erlang-syntax-tools erlang-tftp erlang-tools erlang-xmerl
sudo apt install -y rabbitmq-server
```

### 3. Start and Enable RabbitMQ service
```bash
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

### 4. Enable Management Plugin (Optional but Recommended)
This gives you a web dashboard at `http://localhost:15672` (Default user: `guest`, pass: `guest`).
```bash
sudo rabbitmq-plugins enable rabbitmq_management
```

---

## Phase 2: Install Delayed Message Exchange Plugin

Since you are not using Docker, you must download the plugin manually and place it in the RabbitMQ plugins folder.

### 1. Identify your plugins directory
The directory is usually `/usr/lib/rabbitmq/lib/rabbitmq_server-<version>/plugins`.
You can find yours by running:
```bash
rabbitmq-plugins directories -s
```

### 2. Download the plugin
Replace `<VERSION>` with the latest compatible version (e.g., `3.12.0`). Check [GitHub Releases](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases) for the latest `.ez` file.

```bash
cd /tmp
wget https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v3.12.0/rabbitmq_delayed_message_exchange-3.12.0.ez
```

### 3. Move the plugin to the RabbitMQ directory
*Note: Your path might vary slightly based on the RabbitMQ version.*
```bash
# Example move command
sudo cp rabbitmq_delayed_message_exchange-3.12.0.ez /usr/lib/rabbitmq/plugins/
# OR if you found another path in step 1
# sudo cp rabbitmq_delayed_message_exchange-3.12.0.ez /usr/lib/rabbitmq/lib/rabbitmq_server-<version>/plugins/
```

### 4. Set permissions
```bash
sudo chown rabbitmq:rabbitmq /usr/lib/rabbitmq/plugins/rabbitmq_delayed_message_exchange-3.12.0.ez
```

### 5. Enable the plugin
```bash
sudo rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```

---

## Phase 3: Verification

### 1. Check enabled plugins
```bash
sudo rabbitmq-plugins list | grep delayed
```
You should see: `[E*] rabbitmq_delayed_message_exchange`
- `E` means explicitly enabled.
- `*` means it is running.

### 2. Check Service Status
```bash
sudo systemctl status rabbitmq-server
```

---

## Troubleshooting

- **Check logs**: If it fails to start, check the logs at `/var/log/rabbitmq/`.
- **Erlang version**: RabbitMQ requires Erlang. The official script in Phase 1 usually handles this. If not, follow the [Official Erlang Guide](https://www.rabbitmq.com/install-debian.html#erlang-repositories).
- **Default User**: If `guest`/`guest` doesn't work for the dashboard from a different machine, remember that by default, it's only allowed from `localhost`.
