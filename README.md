# MQTT Proxy Gateway

A lightweight Node.js Express service that acts as a secure bridge between HTTP clients and an MQTT broker. It is specifically designed to relay RPC commands to devices (like Shelly IoT modules) based on local JSON command definitions.

## Features

- **IP Whitelisting:** Restricts access to a specific IP address (defaulting to `127.0.0.1`).
- **Credential Passthrough:** Uses MQTT credentials provided in HTTP headers to connect to the broker dynamically.
- **Command Templates:** Loads command payloads from local `.json` files.
- **Automatic Topic Construction:** Generates MQTT topics using the pattern `${BASE_TOPIC}/${username}/rpc`.

## Prerequisites

- Node.js (v14+ recommended)
- An accessible MQTT Broker (e.g., Mosquitto, EMQX, or a Shelly device in broker mode).

## Installation

1. Clone this repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `command/` directory in the root folder to store your MQTT payloads.

## Configuration

The application is configured using environment variables. You can set these in your shell or via a `.env` file.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GATEWAY_PORT` | The port the Express server listens on. | `3000` |
| `ALLOWED_IP` | The only IP address allowed to call the gateway. | `127.0.0.1` |
| `MQTT_URL` | The URL of the MQTT broker. | `mqtt://localhost:1883` |
| `MQTT_TOPIC` | The base topic prefix for commands. | `shelly` |
| `LOG_ROTATION` | The interval for log file rotation (e.g., '1d', '3d'). | `3d` |

## Directory Structure

```text
.
├── command/           # Place your JSON command files here
│   ├── toggle.json    # Example: http://.../command with x-mqtt-command: toggle
│   └── status.json
├── src/server.js          # Main application logic
└── package.json
```

## Usage

### 1. Define a Command
Create a file at `command/switch-on.json`:
```json
{
  "id": 1,
  "src": "user_1",
  "method": "Switch.Set",
  "params": { "id": 0, "on": true }
}
```

### 2. Start the Gateway
```bash
node src/server.js
```

### 3. Send an HTTP Request
To trigger the command, send a GET request to `/command` with the required headers.

**Example using cURL:**
```bash
curl -X GET http://localhost:3000/command \
     -H "x-mqtt-user: my_username" \
     -H "x-mqtt-pass: my_password" \
     -H "x-mqtt-command: switch-on"
```

### Header Requirements

| Header | Description |
| :--- | :--- |
| `x-mqtt-user` | The username for the MQTT broker. Also used to build the topic. |
| `x-mqtt-pass` | The password for the MQTT broker. |
| `x-mqtt-command` | The filename (without `.json`) inside the `command/` folder. |

## License
MIT