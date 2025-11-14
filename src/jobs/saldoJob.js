import pkg from 'pg'
const { Client } = pkg

async function aumentarSaldosJob() {
  console.log('🔄 EJECUTANDO JOB - Aumentando saldos...', new Date().toLocaleString());
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Conexión a BD establecida')

    const result = await client.query(`
      UPDATE usuarios 
      SET saldo = saldo + 10 
      WHERE saldo < 1000
      RETURNING id, saldo
    `)

    console.log(`✅ Job completado. ${result.rowCount} usuarios actualizados`)
    return result.rows
    
  } catch (error) {
    console.error('❌ ERROR en job:', error.message)
    return []
  } finally {
    await client.end().catch(() => {}) // Silenciar error de cierre
  }
}

export { aumentarSaldosJob }
export default aumentarSaldosJob