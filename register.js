const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

registerForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;

    // Validate inputs
    if (!username || !password || !email || !phone) {
        alert("All fields are required!");
        return;
    }

    // Save the registered user info to localStorage
    const user = {
        username: username,
        password: password,
        email: email,
        phone: phone
    };
    localStorage.setItem("registeredUser", JSON.stringify(user));

    alert("Registration successful!");
    window.location.href = "blog.html"; // Redirect to blog page after registration
});
