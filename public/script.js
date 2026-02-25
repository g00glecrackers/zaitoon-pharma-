// =======================
// GLOBAL VARIABLES
// =======================
let products = [];
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// =======================
// FETCH PRODUCTS
// =======================
fetch("/products")
  .then(res => res.json())
  .then(data => {
    console.log("Products from DB:", data);

    products = data;  
    allProducts = data;   // store all products
    render(allProducts);  // show all initially
  });


// =======================
// RENDER PRODUCTS
// =======================
function render(list){
  let div = document.getElementById("products");
  div.innerHTML = "";

  list.forEach(p => {
    div.innerHTML += `
      <div class="card">
        <img src="uploads/${p.image}" width="200">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart('${p.name}', '${p.price}', '${p.image}')">
          Add to Cart
        </button>
      </div>
    `;
  });
}

// =======================
// ADD TO CART
// =======================
function addToCart(name, price, image){
  cart.push({ name, price, image });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}

// =======================
// SEARCH FUNCTION (optional)
// =======================
function searchProducts(){
  let input = document.getElementById("search").value.toLowerCase();
  let filtered = products.filter(p =>
    p.name.toLowerCase().includes(input)
  );
  render(filtered);
}

function filterCategory(category){

  const resultDiv = document.getElementById("categoryResults");
  resultDiv.innerHTML = "";

  if(category === "All"){
    render(products);
    return;
  }

  const filtered = products.filter(
    p => p.category.toLowerCase() === category.toLowerCase()
  );

  if(filtered.length === 0){
    resultDiv.innerHTML = "<p>No products found</p>";
    return;
  }

  filtered.forEach(p => {
    resultDiv.innerHTML += `
      <div class="card">
        <img src="uploads/${p.image}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart('${p.name}','${p.price}','${p.image}')">
          Add to Cart
        </button>
      </div>
    `;
    resultDiv.scrollIntoView({ behavior: "smooth" });
  });
}
