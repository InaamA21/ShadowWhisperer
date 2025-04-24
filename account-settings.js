const saveChangesBtn = document.getElementById("save-changes-btn");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");

const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));

if (!currentUser) {
    alert("No user is logged in.");
    window.location.href = "login.html"; // Redirect to login page if no user is logged in
}

// Populate inputs with current user data
usernameInput.value = currentUser.username;
emailInput.value = currentUser.email;

// Handle the form submission
saveChangesBtn.addEventListener("click", function () {
    const newUsername = usernameInput.value;
    const newEmail = emailInput.value;

    // Validate inputs
    if (!newUsername || !newEmail) {
        alert("Both fields are required!");
        return;
    }

    // Update the logged-in user's data
    const updatedUser = {
        username: newUsername,
        email: newEmail,
        password: currentUser.password, // Password remains unchanged
    };

    // Save updated user data in localStorage
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

    // Optionally, update 'registeredUser' if needed
    localStorage.setItem("registeredUser", JSON.stringify(updatedUser));

    alert("Account updated successfully!");
    window.location.href = "account.html"; // Redirect to account page after update
});
