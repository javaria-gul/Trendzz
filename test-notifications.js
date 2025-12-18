#!/usr/bin/env node

/**
 * Test Follow Notification Flow
 * This script simulates:
 * 1. User A (Hamza) follows User B (Ayesha)
 * 2. Checks if Ayesha receives the notification in real-time
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// User IDs from our database query
const USER_A_ID = '693e044e2e5d261c57740cf7'; // Hamza
const USER_B_ID = '693e05642e5d261c57740d17'; // Ayesha

// Helper function for HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('\n\n🔥🔥🔥 TESTING FOLLOW NOTIFICATION FLOW 🔥🔥🔥\n');

  try {
    // Step 1: Check backend health
    console.log('📋 Step 1: Checking backend health...');
    const healthRes = await makeRequest(`${BASE_URL}/api/health`);
    console.log(`✅ Backend Status: ${healthRes.data.message}`);

    // Step 2: Check connected sockets
    console.log('\n📋 Step 2: Checking connected socket.io users...');
    const socketsRes = await makeRequest(`${BASE_URL}/api/debug/online-sockets`);
    const { onlineUsers, userSockets } = socketsRes.data;
    console.log(`📶 Total Online Users: ${userSockets.length}`);
    if (userSockets.length > 0) {
      console.log('   Connected users:');
      userSockets.forEach(u => {
        console.log(`   - User ID: ${u.userId}, Socket ID: ${u.socketId}`);
      });
    } else {
      console.log('   ⚠️  NO USERS CONNECTED VIA SOCKET (expected - no browsers open)');
    }

    // Step 3: Simulate follow notification
    console.log('\n📋 Step 3: Simulating follow notification (without socket)...');
    const followRes = await makeRequest(
      `${BASE_URL}/api/debug/simulate-follow?senderId=${USER_A_ID}&recipientId=${USER_B_ID}`
    );
    console.log(`✅ Follow simulation result:
      - Sender: ${followRes.data.test.sendername}
      - Recipient: ${followRes.data.test.recipientName}
      - Notification Created: ${followRes.data.test.notificationCreated ? 'YES' : 'NO'}
      - Recipient Socket ID: ${followRes.data.test.recipientSocketId}`);

    // Step 4: Final check - sockets after notification
    console.log('\n📋 Step 4: Final socket check...');
    const socketsRes2 = await makeRequest(`${BASE_URL}/api/debug/online-sockets`);
    const { userSockets: userSockets2 } = socketsRes2.data;
    console.log(`📶 Final Online Users: ${userSockets2.length}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(70));

    console.log(`\n🎯 NEXT STEPS TO SEE NOTIFICATIONS IN ACTION:\n`);
    console.log(`1. Open 2 browser windows/tabs:`);
    console.log(`   Browser A: http://localhost:3000`);
    console.log(`   Browser B: http://localhost:3000 (incognito or different browser)`);
    console.log(`\n2. Log in as 2 different users:`);
    console.log(`   Browser A: Hamza (or any user)`);
    console.log(`   Browser B: Ayesha (or another user) - KEEP THIS OPEN`);
    console.log(`\n3. From Browser A, navigate to the user's profile in Browser B`);
    console.log(`   and click the FOLLOW button`);
    console.log(`\n4. Switch to Browser B - you should see a NOTIFICATION in real-time! 🎉`);
    console.log(`\n5. If notifications appear, the system is working perfectly! ✅\n`);

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }
}

test();
