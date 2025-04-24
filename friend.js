// Get current user (the one logged in)
const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));
const friendRequestsContainer = document.getElementById("friendRequestsContainer");
const friendRequestsList = document.getElementById("friendRequestsList");

if (!currentUser) {
  alert("No user is logged in.");
  window.location.href = "login.html";  // Redirect to login page if no user is logged in
} else {
  // Fetch friend requests
  const friendRequests = JSON.parse(localStorage.getItem("friendRequests")) || {};

  // Get requests sent to the current user
  const incomingRequests = Object.keys(friendRequests).filter(requester => {
    return friendRequests[requester].includes(currentUser.username);
  });

  // If there are incoming friend requests
  if (incomingRequests.length > 0) {
    // Create a list of friend requests
    incomingRequests.forEach(requester => {
      const li = document.createElement("li");
      li.classList.add("request-item");
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

      // Append to the list
      friendRequestsList.appendChild(li);
    });
  } else {
    // If no incoming requests, show a message
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
