const accountUsername = document.getElementById("username");
const accountEmail = document.getElementById("email");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendRequestsContainer = document.getElementById("friendRequestsContainer");
const friendRequestsList = document.getElementById("friendRequestsList");

const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));

if (currentUser) {
    // Display user details
    accountUsername.textContent = currentUser.username;
    accountEmail.textContent = currentUser.email;
} else {
    alert("No user is logged in.");
    window.location.href = "login.html"; // Redirect to login page if no user is logged in
}

// Handle "Add Friend" button click
addFriendBtn.addEventListener("click", () => {
  if (!currentUser) {
    alert("You must be logged in to send friend requests.");
    return;
  }

  // Get the username of the user whose profile you're viewing (other user)
  const profileUsername = accountUsername.textContent;

  // Fetch current friend requests from local storage or initialize an empty object
  let friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || {};

  // Check if a request has already been sent
  if (!friendRequests[profileUsername]) {
    friendRequests[profileUsername] = [];
  }

  // Add the current user to the requested user's list of requests
  if (!friendRequests[profileUsername].includes(currentUser.username)) {
    friendRequests[profileUsername].push(currentUser.username);
    localStorage.setItem("friendRequests", JSON.stringify(friendRequests));

    alert(`Friend request sent to ${profileUsername}`);
  } else {
    alert(`You have already sent a friend request to ${profileUsername}`);
  }
});

// Fetch and display incoming friend requests
if (!currentUser) {
  alert("No user is logged in.");
  window.location.href = "login.html";  // Redirect to login page if no user is logged in
} else {
  // Fetch friend requests from localStorage
  const friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || {};

  // Filter requests sent to the current user
  const incomingRequests = Object.keys(friendRequests).filter(requester => {
    return friendRequests[requester].includes(currentUser.username);
  });

  // If there are incoming friend requests
  if (incomingRequests.length > 0) {
    incomingRequests.forEach(requester => {
      const li = document.createElement("li");
      li.innerHTML = `
        <p>👤 ${requester} wants to be your friend.</p>
        <button class="accept-btn" data-requester="${requester}">Accept</button>
        <button class="reject-btn" data-requester="${requester}">Reject</button>
      `;

      // Add event listeners for Accept and Reject buttons
      const acceptBtn = li.querySelector(".accept-btn");
      const rejectBtn = li.querySelector(".reject-btn");

      acceptBtn.onclick = () => acceptRequest(requester);
      rejectBtn.onclick = () => rejectRequest(requester);

      // Append to the friend requests list
      friendRequestsList.appendChild(li);
    });
  } else {
    friendRequestsList.innerHTML = "<li>No incoming friend requests.</li>";
  }
}

// Function to accept the friend request
function acceptRequest(requester) {
  const friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || {};
  const friends = JSON.parse(localStorage.getItem("friends")) || {};

  // Add to both users' friends lists
  if (!friends[currentUser.username]) {
    friends[currentUser.username] = [];
  }
  if (!friends[requester]) {
    friends[requester] = [];
  }

  friends[currentUser.username].push(requester);
  friends[requester].push(currentUser.username);

  // Remove the request from friend requests
  delete friendRequests[requester];

  // Save to local storage
  localStorage.setItem("friendRequests", JSON.stringify(friendRequests));
  localStorage.setItem("friends", JSON.stringify(friends));

  // Refresh the list of friend requests
  location.reload(); // Or update the UI dynamically
}

// Function to reject the friend request
function rejectRequest(requester) {
  const friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || {};

  // Remove the request from friend requests
  delete friendRequests[requester];

  // Save the updated friend requests to local storage
  localStorage.setItem("friendRequests", JSON.stringify(friendRequests));

  // Refresh the list of friend requests
  location.reload(); // Or update the UI dynamically
}
