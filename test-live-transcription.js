#!/usr/bin/env node

/**
 * Live Transcription Test Script
 * 
 * This script tests the live transcription functionality end-to-end
 * including browser speech recognition, server-side transcription, and error handling.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Live Transcription Functionality...\n');

// Test configuration
const TEST_CONFIG = {
  backendUrl: 'http://localhost:3001',
  ollamaUrl: 'http://localhost:11434',
  testTimeout: 30000, // 30 seconds
  retryAttempts: 3
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
function logTest(name, status, message = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${statusIcon} ${name}${message ? `: ${message}` : ''}`);
  
  testResults.tests.push({ name, status, message });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test 1: Backend Health Check
async function testBackendHealth() {
  try {
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/health`);
    
    if (response.status === 200 && response.data.success) {
      logTest('Backend Health Check', 'PASS');
      return true;
    } else {
      logTest('Backend Health Check', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Backend Health Check', 'FAIL', error.message);
    return false;
  }
}

// Test 2: Service Status Check
async function testServiceStatus() {
  try {
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/services/status`);
    
    if (response.status === 200 && response.data.success) {
      const { ollama, whisper } = response.data.data;
      
      if (ollama.connected) {
        logTest('Ollama Service', 'PASS', `Model: ${ollama.currentModel}`);
      } else {
        logTest('Ollama Service', 'FAIL', ollama.error || 'Not connected');
      }
      
      if (whisper.connected) {
        logTest('Whisper Service', 'PASS', `Model: ${whisper.currentModel}`);
      } else {
        logTest('Whisper Service', 'FAIL', whisper.error || 'Not connected');
      }
      
      return ollama.connected && whisper.connected;
    } else {
      logTest('Service Status Check', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Service Status Check', 'FAIL', error.message);
    return false;
  }
}

// Test 3: Transcription Endpoint
async function testTranscriptionEndpoint() {
  try {
    // Create a small test audio file (silence)
    const testAudioBuffer = Buffer.alloc(1024); // 1KB of silence
    
    const formData = `--boundary\r\nContent-Disposition: form-data; name="audio"; filename="test.webm"\r\nContent-Type: audio/webm\r\n\r\n${testAudioBuffer}\r\n--boundary--\r\n`;
    
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=boundary',
        'Content-Length': formData.length
      },
      body: formData
    });
    
    if (response.status === 200 && response.data.success) {
      logTest('Transcription Endpoint', 'PASS', 'Endpoint accessible');
      return true;
    } else {
      logTest('Transcription Endpoint', 'FAIL', response.data.error || 'Invalid response');
      return false;
    }
  } catch (error) {
    logTest('Transcription Endpoint', 'FAIL', error.message);
    return false;
  }
}

// Test 4: Ollama Models Check
async function testOllamaModels() {
  try {
    const response = await makeRequest(`${TEST_CONFIG.ollamaUrl}/api/tags`);
    
    if (response.status === 200 && response.data.models) {
      const models = response.data.models.map(m => m.name);
      const hasWhisper = models.some(m => m.toLowerCase().includes('whisper'));
      const hasLlama = models.some(m => m.toLowerCase().includes('llama'));
      
      if (hasWhisper) {
        logTest('Whisper Model', 'PASS', `Available: ${models.filter(m => m.toLowerCase().includes('whisper')).join(', ')}`);
      } else {
        logTest('Whisper Model', 'FAIL', 'Whisper model not found. Run: ollama pull whisper');
      }
      
      if (hasLlama) {
        logTest('LLM Model', 'PASS', `Available: ${models.filter(m => m.toLowerCase().includes('llama')).join(', ')}`);
      } else {
        logTest('LLM Model', 'FAIL', 'LLM model not found. Run: ollama pull llama3.2:3b');
      }
      
      return hasWhisper && hasLlama;
    } else {
      logTest('Ollama Models Check', 'FAIL', 'Could not fetch models');
      return false;
    }
  } catch (error) {
    logTest('Ollama Models Check', 'FAIL', error.message);
    return false;
  }
}

// Test 5: Frontend Build Check
function testFrontendBuild() {
  const distPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(distPath)) {
    logTest('Frontend Build', 'PASS', 'Build files exist');
    return true;
  } else {
    logTest('Frontend Build', 'FAIL', 'Build not found. Run: npm run build');
    return false;
  }
}

// Test 6: Browser Compatibility Check
function testBrowserCompatibility() {
  const compatibilityTests = [
    {
      name: 'MediaRecorder API',
      check: () => typeof MediaRecorder !== 'undefined',
      message: 'Required for audio recording'
    },
    {
      name: 'SpeechRecognition API',
      check: () => typeof SpeechRecognition !== 'undefined' || typeof webkitSpeechRecognition !== 'undefined',
      message: 'Required for browser-based transcription'
    },
    {
      name: 'getUserMedia API',
      check: () => typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
      message: 'Required for microphone access'
    }
  ];
  
  let allPassed = true;
  
  compatibilityTests.forEach(test => {
    try {
      if (test.check()) {
        logTest(test.name, 'PASS');
      } else {
        logTest(test.name, 'FAIL', test.message);
        allPassed = false;
      }
    } catch (error) {
      logTest(test.name, 'FAIL', `Error: ${error.message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Test 7: SSL Certificate Check (for HTTPS)
function testSSLCertificates() {
  const certPath = path.join(__dirname, 'ssl-certs', 'server.crt');
  const keyPath = path.join(__dirname, 'ssl-certs', 'server.key');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    logTest('SSL Certificates', 'PASS', 'HTTPS enabled for microphone access');
    return true;
  } else {
    logTest('SSL Certificates', 'SKIP', 'HTTP only (microphone access limited)');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('Starting comprehensive live transcription tests...\n');
  
  // Core functionality tests
  await testBackendHealth();
  await testServiceStatus();
  await testTranscriptionEndpoint();
  await testOllamaModels();
  
  // Build and compatibility tests
  testFrontendBuild();
  testBrowserCompatibility();
  testSSLCertificates();
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.tests.length}`);
  
  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`🎯 Success Rate: ${successRate}%`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (testResults.failed > 0) {
    console.log('❌ Some tests failed. Please address the following:');
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  }
  
  if (testResults.passed === testResults.tests.length) {
    console.log('🎉 All tests passed! Live transcription is ready to use.');
    console.log('\n🚀 To start the application:');
    console.log('   npm run dev');
    console.log('\n📱 Then open: http://localhost:3000 (or https://localhost:3443 for microphone access)');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above before using live transcription.');
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Test interrupted by user');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test runner error:', error.message);
  process.exit(1);
});