const date = new Date();
const formattedDate = `${String(date.getSeconds()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
console.log(formattedDate);