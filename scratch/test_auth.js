// Test script to verify backend auth endpoints

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🧪 Iniciando pruebas de autenticación...');

  const uniqueEmail = `test_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Usuario de Pruebas';

  let cookies = '';

  // Helper to extract session cookie
  function getCookie(res) {
    const raw = res.headers.get('set-cookie');
    if (raw) {
      cookies = raw.split(';')[0];
    }
  }

  // 1. Test unprotected route
  console.log('\n1. Probando ruta pública GET /api/events...');
  const eventsRes = await fetch(`${baseUrl}/api/events`);
  console.log(`Status: ${eventsRes.status} (Esperado: 200)`);

  // 2. Test protected route without auth
  console.log('\n2. Probando ruta protegida GET /api/stats (sin estar autenticado)...');
  const statsUnauthRes = await fetch(`${baseUrl}/api/stats`);
  console.log(`Status: ${statsUnauthRes.status} (Esperado: 401)`);
  const statsUnauthData = await statsUnauthRes.json();
  console.log('Respuesta:', statsUnauthData);

  // 3. Register user
  console.log(`\n3. Registrando nuevo usuario (${uniqueEmail})...`);
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email: uniqueEmail, password })
  });
  console.log(`Status: ${registerRes.status} (Esperado: 201)`);
  const registerData = await registerRes.json();
  console.log('Respuesta:', registerData);
  getCookie(registerRes);

  // 4. Verify auth/me with current cookie
  console.log('\n4. Verificando estado de la sesión activa GET /api/auth/me...');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { 'Cookie': cookies }
  });
  console.log(`Status: ${meRes.status} (Esperado: 200)`);
  const meData = await meRes.json();
  console.log('Respuesta:', meData);

  // 5. Test protected route with active session cookie
  console.log('\n5. Accediendo a ruta protegida GET /api/stats con cookie de sesión...');
  const statsAuthRes = await fetch(`${baseUrl}/api/stats`, {
    headers: { 'Cookie': cookies }
  });
  console.log(`Status: ${statsAuthRes.status} (Esperado: 200)`);
  const statsAuthData = await statsAuthRes.json();
  console.log('Respuesta:', statsAuthData);

  // 6. Test login with wrong password
  console.log('\n6. Intentando iniciar sesión con contraseña incorrecta...');
  const loginWrongRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: 'wrongpassword' })
  });
  console.log(`Status: ${loginWrongRes.status} (Esperado: 401)`);
  const loginWrongData = await loginWrongRes.json();
  console.log('Respuesta:', loginWrongData);

  // 7. Test login with correct password
  console.log('\n7. Iniciando sesión con contraseña correcta...');
  const loginRightRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password })
  });
  console.log(`Status: ${loginRightRes.status} (Esperado: 200)`);
  const loginRightData = await loginRightRes.json();
  console.log('Respuesta:', loginRightData);
  getCookie(loginRightRes);

  // 8. Test logout
  console.log('\n8. Cerrando sesión POST /api/auth/logout...');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Cookie': cookies }
  });
  console.log(`Status: ${logoutRes.status} (Esperado: 200)`);
  const logoutData = await logoutRes.json();
  console.log('Respuesta:', logoutData);

  // 9. Verify session is destroyed
  console.log('\n9. Verificando estado de sesión después del logout...');
  const meAfterRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { 'Cookie': cookies }
  });
  const meAfterData = await meAfterRes.json();
  console.log('Respuesta:', meAfterData);

  console.log('\n🎉 Pruebas completadas.');
}

runTests().catch(console.error);
