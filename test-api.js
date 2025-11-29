// Test script for AntiGravity Backend v2
// Run with: node test-api.js (after starting the server)

const API_BASE = 'http://localhost:3000';

async function testSingleVerify() {
    console.log('\n🧪 Testing Single URL Verification...');
    try {
        const response = await fetch(`${API_BASE}/api/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: 'https://google.com',
                context: 'Test verification'
            })
        });
        const result = await response.json();
        console.log('✅ Single verify works!');
        console.log('   Risk Level:', result.riskLevel);
        console.log('   Final URL:', result.finalUrl);
        console.log('   DNS Valid:', result.dns?.valid);
        return true;
    } catch (error) {
        console.error('❌ Single verify failed:', error.message);
        return false;
    }
}

async function testBatchVerify() {
    console.log('\n🧪 Testing Batch Verification...');
    try {
        const response = await fetch(`${API_BASE}/api/verify/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                urls: [
                    'https://google.com',
                    'https://github.com',
                    'https://example.com'
                ]
            })
        });
        const result = await response.json();
        console.log('✅ Batch verify works!');
        console.log('   Total:', result.total);
        console.log('   Processed:', result.processed);
        console.log('   Results:', result.results.length);
        return true;
    } catch (error) {
        console.error('❌ Batch verify failed:', error.message);
        return false;
    }
}

async function testHealth() {
    console.log('\n🧪 Testing Health Check...');
    try {
        const response = await fetch(`${API_BASE}/health`);
        const result = await response.json();
        console.log('✅ Health check works!');
        console.log('   Status:', result.status);
        console.log('   Version:', result.version);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testRedirectResolution() {
    console.log('\n🧪 Testing Redirect Resolution...');
    try {
        const response = await fetch(`${API_BASE}/api/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: 'https://bit.ly/3QJvN0Y' // Example shortened URL
            })
        });
        const result = await response.json();
        console.log('✅ Redirect resolution works!');
        console.log('   Original:', result.url);
        console.log('   Final:', result.finalUrl);
        console.log('   Redirects:', result.redirects?.length || 0);
        return true;
    } catch (error) {
        console.error('❌ Redirect resolution failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 AntiGravity Backend v2 - Test Suite');
    console.log('=====================================');

    const results = {
        health: await testHealth(),
        single: await testSingleVerify(),
        batch: await testBatchVerify(),
        redirect: await testRedirectResolution()
    };

    console.log('\n📊 Test Results:');
    console.log('=====================================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(r => r);
    console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
}

// Run tests
runAllTests().catch(console.error);
