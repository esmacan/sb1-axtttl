import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import snmp from 'net-snmp';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const POLLING_INTERVAL = 5000; // 5 seconds

// SNMP OIDs for Cisco Catalyst 9000
const OIDs = {
  CPU_USAGE: '1.3.6.1.4.1.9.9.109.1.1.1.1.5.1',
  MEMORY_USED: '1.3.6.1.4.1.9.9.48.1.1.1.5.1',
  MEMORY_FREE: '1.3.6.1.4.1.9.9.48.1.1.1.6.1',
  TEMPERATURE: '1.3.6.1.4.1.9.9.13.1.3.1.3.1',
  INTERFACE_IN_OCTETS: '1.3.6.1.2.1.31.1.1.1.6.1',
  INTERFACE_OUT_OCTETS: '1.3.6.1.2.1.31.1.1.1.10.1'
};

let snmpSession = null;
let monitoringInterval = null;

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('startMonitoring', (config) => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

    if (snmpSession) {
      snmpSession.close();
    }

    // Create SNMP v3 session
    const options = {
      port: 161,
      retries: 1,
      timeout: 5000,
      transport: "udp4",
      version: snmp.Version3,
      securityLevel: snmp.SecurityLevel.authPriv,
      securityName: config.username,
      authProtocol: snmp.AuthProtocols[config.authProtocol],
      authKey: config.authKey,
      privProtocol: snmp.PrivProtocols[config.privProtocol],
      privKey: config.privKey
    };

    snmpSession = snmp.createV3Session(config.host, options);

    monitoringInterval = setInterval(() => {
      snmpSession.get([
        OIDs.CPU_USAGE,
        OIDs.MEMORY_USED,
        OIDs.MEMORY_FREE,
        OIDs.TEMPERATURE,
        OIDs.INTERFACE_IN_OCTETS,
        OIDs.INTERFACE_OUT_OCTETS
      ], (error, varbinds) => {
        if (error) {
          console.error(error);
          return;
        }

        if (snmp.isVarbindError(varbinds[0])) {
          console.error(snmp.varbindError(varbinds[0]));
          return;
        }

        const cpuUsage = varbinds[0].value;
        const memoryUsed = varbinds[1].value;
        const memoryFree = varbinds[2].value;
        const temperature = varbinds[3].value;
        const interfaceInOctets = varbinds[4].value;
        const interfaceOutOctets = varbinds[5].value;

        const totalMemory = memoryUsed + memoryFree;
        const memoryUsage = (memoryUsed / totalMemory) * 100;
        const interfaceUtilization = ((interfaceInOctets + interfaceOutOctets) / 1000000) * 100; // Simplified calculation

        socket.emit('metrics', {
          timestamp: Date.now(),
          cpuUsage,
          memoryUsage,
          temperature,
          interfaceUtilization
        });
      });
    }, POLLING_INTERVAL);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    if (snmpSession) {
      snmpSession.close();
    }
  });
});

httpServer.listen(3001, () => {
  console.log('Server running on port 3001');
});