const loginForm = document.getElementById("loginForm");

const loginButton = document.getElementById("loginButton");

const loadingMessage =
  document.getElementById("loadingMessage");

const errorMessage =
  document.getElementById("errorMessage");


loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();


  const username =
    document.getElementById("username").value.trim();

  const password =
    document.getElementById("password").value;


  loadingMessage.hidden = false;

  errorMessage.hidden = true;

  loginButton.disabled = true;


  try {

    const response = await fetch(
      "https://dummyjson.com/users"
    );


    if (!response.ok) {

      throw new Error(
        "Gagal mengambil data pengguna."
      );

    }


    const data = await response.json();


    const user = data.users.find((item) => {

      return (
        item.username === username &&
        item.password === password
      );

    });


    if (!user) {

      throw new Error(
        "Username atau password salah."
      );

    }


    localStorage.setItem(
      "firstName",
      user.firstName
    );


    localStorage.setItem(
      "username",
      user.username
    );


    window.location.href = "catalog.html";


  } catch (error) {

    errorMessage.textContent =
      error.message;

    errorMessage.hidden = false;


  } finally {

    loadingMessage.hidden = true;

    loginButton.disabled = false;

  }

});