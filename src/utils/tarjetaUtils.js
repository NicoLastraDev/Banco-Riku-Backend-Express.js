// utils/tarjetaUtils.js

// Generar número de tarjeta (formato Mastercard)
export const generarNumeroTarjeta = () => {
  // Mastercard empieza con 5
  let numero = '5';
  for (let i = 0; i < 15; i++) {
    numero += Math.floor(Math.random() * 10);
  }
  return numero;
};

// Generar número de cuenta
export const generarNumeroCuenta = () => {
  return Array.from({length: 10}, () => Math.floor(Math.random() * 10)).join('');
};

// Generar fecha de vencimiento (4 años desde hoy)
export const generarFechaVencimiento = () => {
  const hoy = new Date();
  const vencimiento = new Date(hoy.getFullYear() + 4, hoy.getMonth());
  return `${(vencimiento.getMonth() + 1).toString().padStart(2, '0')}/${vencimiento.getFullYear().toString().slice(-2)}`;
};

// Generar CVV de 3 dígitos
export const generarCVV = () => {
  return Array.from({length: 3}, () => Math.floor(Math.random() * 10)).join('');
};