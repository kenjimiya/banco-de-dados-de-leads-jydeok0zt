const UNIDADES = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
]

const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
]

const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
]

function threeDigitsToWords(n: number): string {
  if (n === 100) return 'cem'
  const hundreds = Math.floor(n / 100)
  const remainder = n % 100
  let words = ''
  if (hundreds > 0) words += CENTENAS[hundreds]
  if (remainder > 0) {
    if (hundreds > 0) words += ' e '
    if (remainder < 20) {
      words += UNIDADES[remainder]
    } else {
      const tens = Math.floor(remainder / 10)
      const units = remainder % 10
      words += DEZENAS[tens]
      if (units > 0) words += ' e ' + UNIDADES[units]
    }
  }
  return words
}

function intToWords(n: number): string {
  if (n === 0) return 'zero'
  let words = ''
  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000)
    if (millions === 1) words += 'um milhão'
    else words += intToWords(millions) + ' milhões'
    n %= 1000000
    if (n > 0) words += ' e '
  }
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000)
    if (thousands === 1) words += 'um mil'
    else words += threeDigitsToWords(thousands) + ' mil'
    n %= 1000
    if (n > 0) words += ' e '
  }
  if (n > 0) words += threeDigitsToWords(n)
  return words
}

export function valueToWords(value: number): string {
  const reais = Math.floor(value)
  const centavos = Math.round((value - reais) * 100)
  let result = ''
  if (reais === 0) {
    result = 'zero reais'
  } else if (reais === 1) {
    result = 'um real'
  } else {
    result = intToWords(reais) + ' reais'
  }
  if (centavos > 0) {
    if (centavos === 1) result += ' e um centavo'
    else result += ' e ' + intToWords(centavos) + ' centavos'
  }
  return result.charAt(0).toUpperCase() + result.slice(1)
}
