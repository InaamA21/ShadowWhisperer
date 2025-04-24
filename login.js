const loginForm = document.getElementById("loginForm");
const loginUsernameInput = document.getElementById("username");
const loginPasswordInput = document.getElementById("password");

loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    const enteredUsername = loginUsernameInput.value;
    const enteredPassword = loginPasswordInput.value;

    // Retrieve saved user from localStorage
    const savedUser = JSON.parse(localStorage.getItem("registeredUser"));

    // Validate login credentials
    if (savedUser && enteredUsername === savedUser.username && enteredPassword === savedUser.password) {
        // Clear old data (just to be safe)
        localStorage.removeItem("loggedInUser");

        // Store logged-in user in localStorage
        localStorage.setItem("loggedInUser", JSON.stringify(savedUser)); // Store the correct logged-in user

        alert("Login successful!");
        window.location.href = "blog.html"; // Redirect to account page
    } else {
        alert("Invalid credentials. Please try again.");
    }
});
