// ==========================================
// SIGNATURE WEAR - ADMIN PANEL V2
// ==========================================

// Supabase Project
const SUPABASE_URL =
  "https://iworypmvibxrvtpfyhlm.supabase.co";

// Supabase ANON / PUBLISHABLE KEY
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3J5cG12aWJ4cnZ0cGZ5aGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjIzMDEsImV4cCI6MjEwMjE5ODMwMX0.uLliY8v9RkqZIepCbjbeVKYg0KavagsAB9uUyff8Jdo";

const { createClient } = window.supabase;

const sb = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==========================================
// STATE
// ==========================================

const state = {
  products: [],
  orders: [],
  editing: null,
  previewUrl: ""
};


// ==========================================
// HELPERS
// ==========================================

const $ = (id) =>
  document.getElementById(id);


function toast(message, error = false) {

  const t = $("toast");

  if (!t) return;

  t.textContent = message;

  t.className =
    `toast show${error ? " error" : ""}`;

  clearTimeout(window.__toast);

  window.__toast =
    setTimeout(() => {
      t.className = "toast";
    }, 3000);
}


function loading(show) {

  const el = $("loading");

  if (!el) return;

  el.classList.toggle(
    "hidden",
    !show
  );
}


function esc(value = "") {

  return String(value).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}


// ==========================================
// AUTH
// ==========================================

async function boot() {

  const {
    data: {
      session
    }
  } = await sb.auth.getSession();


  if (session) {

    await verifyAdmin(session.user);

  } else {

    showLogin();

  }


  sb.auth.onAuthStateChange(
    async (event, session) => {

      if (event === "SIGNED_OUT") {

        showLogin();

        return;

      }


      if (session) {

        await verifyAdmin(
          session.user
        );

      }

    }
  );
}


// ==========================================
// ADMIN VERIFICATION
// ==========================================

async function verifyAdmin(user) {

  const {
    data,
    error
  } = await sb
    .from("admin_users")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();


  if (error || !data) {

    await sb.auth.signOut();

    showLogin();

    toast(
      "You are not authorized as admin.",
      true
    );

    return;

  }


  showApp(
    user,
    data.username
  );

  await loadAll();
}


// ==========================================
// LOGIN / APP
// ==========================================

function showLogin() {

  $("loginScreen")
    .classList
    .remove("hidden");

  $("app")
    .classList
    .add("hidden");
}


function showApp(
  user,
  username
) {

  $("loginScreen")
    .classList
    .add("hidden");

  $("app")
    .classList
    .remove("hidden");


  if ($("adminName")) {

    $("adminName").textContent =
      username ||
      user.user_metadata?.username ||
      "Administrator";

  }
}


// ==========================================
// LOGIN
// ==========================================

$("loginForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const username =
      $("username")
        .value
        .trim();


    const password =
      $("password")
        .value;


    if (!username || !password) {

      toast(
        "Username and password required.",
        true
      );

      return;

    }


    $("loginBtn").disabled = true;

    $("loginBtn").textContent =
      "Signing in...";


    try {

      // Get admin user's real email
      const {
        data,
        error
      } = await sb
        .from("admin_users")
        .select("email, username")
        .eq(
          "username",
          username
        )
        .maybeSingle();


      if (error) {

        throw error;

      }


      if (!data) {

        throw new Error(
          "Invalid username or password."
        );

      }


      // Supabase Auth login
      const result =
        await sb.auth
          .signInWithPassword({
            email: data.email,
            password: password
          });


      if (result.error) {

        throw result.error;

      }


      await verifyAdmin(
        result.data.user
      );


    } catch (error) {

      console.error(error);

      toast(
        "Invalid username or password.",
        true
      );

    } finally {

      $("loginBtn").disabled =
        false;

      $("loginBtn").textContent =
        "Login";

    }

  }
);


// ==========================================
// // ==========================================
// FORGOT PASSWORD
// ==========================================

$("forgotPasswordBtn").onclick = async () => {

  const resetEmail = "abdulhadifarhan521@gmail.com";

  const { error } = await sb.auth.resetPasswordForEmail(
    resetEmail,
    {
      redirectTo:
        "https://signature-wear-9r4c.vercel.app/admin-v2.html"
    }
  );

  if (error) {
    console.error(error);
    toast(
      "Password reset email could not be sent.",
      true
    );
    return;
  }

  toast(
    "Password reset link sent to your email."
  );
};
// LOGOUT
// ==========================================

$("logoutBtn").onclick =
  async () => {

    const {
      error
    } = await sb.auth.signOut();


    if (error) {

      toast(
        error.message,
        true
      );

      return;

    }


    toast(
      "Logged out successfully."
    );

  };


// ==========================================
// NAVIGATION
// ==========================================

document
  .querySelectorAll(".nav-item")
  .forEach(button => {

    button.onclick = () => {

      openPage(
        button.dataset.page
      );

    };

  });


function openPage(page) {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });


  [
    "dashboard",
    "products",
    "orders"
  ].forEach(p => {

    $(`${p}Page`)
      .classList
      .toggle(
        "hidden",
        p !== page
      );

  });


  $("pageTitle").textContent =
    page.charAt(0).toUpperCase() +
    page.slice(1);


  if (page === "products") {

    renderProducts();

  }


  if (page === "orders") {

    renderOrders();

  }

}


// ==========================================
// MOBILE MENU
// ==========================================

$("menuBtn").onclick =
  () => {

    document
      .querySelector(".sidebar")
      .classList
      .toggle("open");

  };


// ==========================================
// DARK MODE
// ==========================================

$("themeBtn").onclick =
  () => {

    document.body
      .classList
      .toggle("dark");


    const dark =
      document.body
        .classList
        .contains("dark");


    localStorage.setItem(
      "sw-theme",
      dark
        ? "dark"
        : "light"
    );


    $("themeBtn").textContent =
      dark
        ? "☀ Light mode"
        : "☾ Dark mode";

  };


if (
  localStorage.getItem(
    "sw-theme"
  ) === "dark"
) {

  document.body
    .classList
    .add("dark");

  $("themeBtn").textContent =
    "☀ Light mode";

}


// ==========================================
// LOAD ALL DATA
// ==========================================

async function loadAll() {

  loading(true);

  try {

    await Promise.all([
      loadProducts(),
      loadOrders()
    ]);

    updateStats();

  } catch (error) {

    console.error(error);

    toast(
      error.message ||
      "Could not load data.",
      true
    );

  } finally {

    loading(false);

  }

}


// ==========================================
// PRODUCTS
// ==========================================

async function loadProducts() {

  const {
    data,
    error
  } = await sb
    .from("products")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    throw error;

  }


  state.products =
    data || [];


  populateCategories();

  renderProducts();

}


async function loadOrders() {

  const {
    data,
    error
  } = await sb
    .from("orders")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.warn(
      "Orders:",
      error.message
    );

    state.orders = [];

    return;

  }


  state.orders =
    data || [];


  renderOrders();

}


// ==========================================
// DASHBOARD STATS
// ==========================================

function updateStats() {

  $("statProducts").textContent =
    state.products.length;


  $("statOrders").textContent =
    state.orders.length;


  const categories =
    new Set(
      state.products
        .map(
          product =>
            (product.category || "")
              .trim()
        )
        .filter(Boolean)
    );


  $("statCategories").textContent =
    categories.size;

}


// ==========================================
// CATEGORY FILTER
// ==========================================

function populateCategories() {

  const current =
    $("categoryFilter").value;


  const categories =
    [
      ...new Set(
        state.products
          .map(
            product =>
              (product.category || "")
                .trim()
          )
          .filter(Boolean)
      )
    ]
    .sort();


  $("categoryFilter").innerHTML =
    `
      <option value="">
        All categories
      </option>
    ` +
    categories
      .map(
        category =>
          `
          <option value="${esc(category)}">
            ${esc(category)}
          </option>
          `
      )
      .join("");


  $("categoryFilter").value =
    current;

}


// ==========================================
// SEARCH
// ==========================================

function filteredProducts() {

  const search =
    $("searchInput")
      .value
      .trim()
      .toLowerCase();


  const category =
    $("categoryFilter").value;


  return state.products.filter(
    product => {

      const matchesSearch =
        !search ||
        `
        ${product.name}
        ${product.description || ""}
        ${product.category || ""}
        ${product.colour || ""}
        `
          .toLowerCase()
          .includes(search);


      const matchesCategory =
        !category ||
        product.category === category;


      return (
        matchesSearch &&
        matchesCategory
      );

    }
  );

}


$("searchInput").oninput =
  renderProducts;


$("categoryFilter").onchange =
  renderProducts;


// ==========================================
// RENDER PRODUCTS
// ==========================================

function renderProducts() {

  const products =
    filteredProducts();


  $("emptyProducts")
    .classList
    .toggle(
      "hidden",
      products.length !== 0
    );


  $("productsBody").innerHTML =
    products
      .map(
        product => `

        <tr>

          <td>
            ${
              product.image
                ? `
                  <img
                    class="product-thumb"
                    src="${esc(product.image)}"
                    alt=""
                  >
                `
                : "—"
            }
          </td>

          <td>
            <strong>
              ${esc(product.name)}
            </strong>
          </td>

          <td>
            ${esc(product.price)}
          </td>

          <td>
            ${esc(product.category)}
          </td>

          <td>
            ${esc(product.size)}
          </td>

          <td>
            ${esc(product.colour)}
          </td>

          <td>

            <div class="actions">

              <button
                class="small-btn"
                data-edit="${product.id}">
                Edit
              </button>

              <button
                class="small-btn"
                data-delete="${product.id}">
                Delete
              </button>

            </div>

          </td>

        </tr>

        `
      )
      .join("");

}


// ==========================================
// PRODUCT ACTIONS
// ==========================================

$("productsBody")
  .addEventListener(
    "click",
    event => {

      const edit =
        event.target.dataset.edit;


      const del =
        event.target.dataset.delete;


      if (edit) {

        openProduct(edit);

      }


      if (del) {

        deleteProduct(del);

      }

    }
  );


// ==========================================
// OPEN PRODUCT
// ==========================================

function openProduct(id = null) {

  state.editing =
    id
      ? state.products.find(
          product =>
            product.id == id
        )
      : null;


  const product =
    state.editing;


  $("modalTitle").textContent =
    product
      ? "Edit Product"
      : "Add Product";


  $("productId").value =
    product?.id || "";


  $("productName").value =
    product?.name || "";


  $("productPrice").value =
    product?.price ?? "";


  $("productCategory").value =
    product?.category || "";


  $("productSize").value =
    product?.size || "";


  $("productColour").value =
    product?.colour || "";


  $("productDescription").value =
    product?.description || "";


  $("productImage").value =
    "";


  state.previewUrl =
    product?.image || "";


  $("imagePreview").src =
    state.previewUrl;


  $("imagePreview")
    .classList
    .toggle(
      "hidden",
      !state.previewUrl
    );


  $("productDialog")
    .showModal();

}


// ==========================================
// ADD PRODUCT
// ==========================================

$("addProductBtn").onclick =
  () => openProduct();


$("addProductQuick").onclick =
  () => {

    openPage("products");

    openProduct();

  };


$("viewOrdersQuick").onclick =
  () => openPage("orders");


// ==========================================
// CLOSE PRODUCT MODAL
// ==========================================

$("closeProduct").onclick =
  () => {

    $("productDialog").close();

  };


$("cancelProduct").onclick =
  () => {

    $("productDialog").close();

  };


// ==========================================
// IMAGE PREVIEW
// ==========================================

$("productImage").onchange =
  event => {

    const file =
      event.target.files[0];


    if (!file) return;


    const url =
      URL.createObjectURL(file);


    state.previewUrl =
      url;


    $("imagePreview").src =
      url;


    $("imagePreview")
      .classList
      .remove("hidden");

  };


// ==========================================
// UPLOAD IMAGE
// ==========================================

async function uploadImage(file) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";


  const path =
    `products/${crypto.randomUUID()}.${extension}`;


  const {
    error
  } = await sb.storage
    .from("product-images")
    .upload(
      path,
      file,
      {
        upsert: false,
        contentType: file.type
      }
    );


  if (error) {

    throw error;

  }


  const {
    data
  } = sb.storage
    .from("product-images")
    .getPublicUrl(path);


  return data.publicUrl;

}


// ==========================================
// SAVE PRODUCT
// ==========================================

$("productForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      loading(true);


      try {

        const id =
          $("productId").value ||
          null;


        const file =
          $("productImage")
            .files[0];


        let image =
          state.editing?.image ||
          null;


        if (file) {

          if (
            file.size >
            5 * 1024 * 1024
          ) {

            throw new Error(
              "Image must be 5MB or smaller."
            );

          }


          image =
            await uploadImage(file);

        }


        const payload = {

          name:
            $("productName")
              .value
              .trim(),

          price:
            Number(
              $("productPrice")
                .value
            ),

          description:
            $("productDescription")
              .value
              .trim(),

          category:
            $("productCategory")
              .value
              .trim(),

          size:
            $("productSize")
              .value
              .trim(),

          colour:
            $("productColour")
              .value
              .trim(),

          image

        };


        const result =
          id

            ? await sb
                .from("products")
                .update(payload)
                .eq("id", id)

            : await sb
                .from("products")
                .insert(
                  payload
                );


        if (result.error) {

          throw result.error;

        }


        $("productDialog")
          .close();


        toast(
          id
            ? "Product updated successfully."
            : "Product added successfully."
        );


        await loadProducts();

        updateStats();


      } catch (error) {

        console.error(error);

        toast(
          error.message ||
          "Could not save product.",
          true
        );


      } finally {

        loading(false);

      }

    }
  );


// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(id) {

  const product =
    state.products.find(
      item =>
        item.id == id
    );


  if (!product) return;


  const confirmed =
    confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );


  if (!confirmed) return;


  loading(true);


  try {

    const {
      error
    } = await sb
      .from("products")
      .delete()
      .eq(
        "id",
        id
      );


    if (error) {

      throw error;

    }


    toast(
      "Product deleted."
    );


    await loadProducts();

    updateStats();


  } catch (error) {

    toast(
      error.message,
      true
    );


  } finally {

    loading(false);

  }

}


// ==========================================
// ORDERS
// ==========================================

function renderOrders() {

  $("emptyOrders")
    .classList
    .toggle(
      "hidden",
      state.orders.length !== 0
    );


  $("ordersBody").innerHTML =
    state.orders
      .map(
        order => `

        <tr>

          <td>
            ${esc(
              order.customer_name ||
              order.name ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              order.phone ||
              order.phone_number ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              order.product_name ||
              order.product ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              formatDate(
                order.created_at ||
                order.order_date
              )
            )}
          </td>

          <td>

            <button
              class="small-btn"
              data-order="${order.id}">
              Details
            </button>

          </td>

        </tr>

        `
      )
      .join("");

}


// ==========================================
// DATE
// ==========================================

function formatDate(value) {

  if (!value) {

    return "—";

  }


  const date =
    new Date(value);


  if (isNaN(date)) {

    return "—";

  }


  return date.toLocaleString();

}


// ==========================================
// ORDER DETAILS
// ==========================================

$("ordersBody")
  .addEventListener(
    "click",
    event => {

      const id =
        event.target.dataset.order;


      if (!id) return;


      const order =
        state.orders.find(
          item =>
            item.id == id
        );


      if (!order) return;


      $("orderDetails")
        .innerHTML = `

        <div class="detail-row">

          <b>
            Customer Name
          </b>

          ${esc(
            order.customer_name ||
            order.name ||
            "—"
          )}

        </div>


        <div class="detail-row">

          <b>
            Phone Number
          </b>

          ${esc(
            order.phone ||
            order.phone_number ||
            "—"
          )}

        </div>


        <div class="detail-row">

          <b>
            Address
          </b>

          ${esc(
            order.address ||
            "—"
          )}

        </div>


        <div class="detail-row">

          <b>
            Ordered Product
          </b>

          ${esc(
            order.product_name ||
            order.product ||
            "—"
          )}

        </div>


        <div class="detail-row">

          <b>
            Order Date
          </b>

          ${esc(
            formatDate(
              order.created_at ||
              order.order_date
            )
          )}

        </div>

      `;


      $("orderDialog")
        .showModal();

    }
  );


// ==========================================
// CLOSE ORDER
// ==========================================

$("closeOrder").onclick =
  () => {

    $("orderDialog").close();

  };


// ==========================================
// START
// ==========================================

boot();
