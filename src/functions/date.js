export default() =>{
  const dataAtual = new Date();

  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); // Meses começam do zero
  const ano = dataAtual.getFullYear();
  
  const dataFormatada = `${dia}-${mes}-${ano}`;
  return dataFormatada
}