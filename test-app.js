#!/usr/bin/env node

// Simple test script to verify the application is working
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing MeetingScribe AI Application...\n');

// Test 1: Check if backend server is running
function testBackend() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success && result.data.status === 'healthy') {
            console.log('✅ Backend server is running and healthy');
            resolve(true);
          } else {
            console.log('❌ Backend server returned unexpected response');
            reject(new Error('Invalid response'));
          }
        } catch (e) {
          console.log('❌ Backend server returned invalid JSON');
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend server is not running');
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend server connection timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Test 2: Check if frontend build exists
function testFrontend() {
  const distPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    console.log('✅ Frontend build exists');
    return true;
  } else {
    console.log('❌ Frontend build not found - run "npm run build" first');
    return false;
  }
}

// Test 3: Check if required models are available (if Ollama is running)
async function testOllama() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      const hasWhisper = models.some(m => m.name.includes('whisper'));
      const hasLlama = models.some(m => m.name.includes('llama'));
      
      if (hasWhisper && hasLlama) {
        console.log('✅ Ollama is running with required models');
        return true;
      } else {
        console.log('⚠️  Ollama is running but missing some models');
        console.log('   Run: ollama pull whisper && ollama pull llama3.2:3b');
        return false;
      }
    }
  } catch (e) {
    console.log('⚠️  Ollama is not running or not accessible');
    console.log('   Run: ollama serve');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Running tests...\n');
  
  const results = [];
  
  // Test frontend
  results.push(testFrontend());
  
  // Test backend
  try {
    await testBackend();
    results.push(true);
  } catch (e) {
    results.push(false);
  }
  
  // Test Ollama
  results.push(await testOllama());
  
  console.log('\n📊 Test Results:');
  console.log(`Frontend: ${results[0] ? '✅' : '❌'}`);
  console.log(`Backend:  ${results[1] ? '✅' : '❌'}`);
  console.log(`Ollama:   ${results[2] ? '✅' : '⚠️'}`);
  
  const allPassed = results.every(r => r === true);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The application is ready to use.');
    console.log('\n🚀 To start the application:');
    console.log('   npm run dev');
    console.log('\n📱 Then open: http://localhost:3000');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    if (!results[0]) {
      console.log('   Run: npm run build');
    }
    if (!results[1]) {
      console.log('   Run: npm run dev:backend');
    }
    if (!results[2]) {
      console.log('   Run: ollama serve && ollama pull whisper && ollama pull llama3.2:3b');
    }
  }
}

runTests().catch(console.error);