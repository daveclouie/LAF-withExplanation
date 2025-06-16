import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const lostForm = document.getElementById("lostForm");
const foundForm = document.getElementById("foundForm");
const lostItems = document.getElementById("lostItems");
const foundItems = document.getElementById("foundItems");
const profileContent = document.getElementById("profileContent");

let currentPopupItem = null;

document.addEventListener("DOMContentLoaded", () => {
  let savedTab = localStorage.getItem('activeTab') || 'home';

  if (savedTab === 'signout') {
    savedTab = 'home';
    localStorage.setItem('activeTab', 'home');
  }

  const tabButton = Array.from(document.querySelectorAll('.tab-button'))
    .find(btn => btn.textContent.toLowerCase().replace(/\s+/g, "") === savedTab);

  showTab(savedTab, tabButton);

  document.body.classList.add('tabs-ready');
});

function showTab(tabId, button) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active-tab'));
  if (button) button.classList.add('active-tab');

  localStorage.setItem('activeTab', tabId);

  if (tabId !== 'reportlost') {
    const lostForm = document.getElementById("lostForm");
    if (lostForm) lostForm.reset();
  }

  if (tabId !== 'reportfound') {
    const foundForm = document.getElementById("foundForm");
    if (foundForm) foundForm.reset();
  }
}

document.querySelectorAll(".tab-button").forEach(button => {
  if (button.id === "notificationBtn") return;

  button.addEventListener("click", () => {
    const tabId = button.textContent.toLowerCase().replace(/\s+/g, "");
    showTab(tabId, button);
  });
});

document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("cancel-btn")) {
    console.log("✅ Cancel button clicked");

    const form = e.target.closest("form");
    if (form) form.reset();

    const homeTabButton = Array.from(document.querySelectorAll(".tab-button"))
      .find(btn => btn.textContent.trim().toLowerCase() === "home");

    if (homeTabButton) {
      showTab("home", homeTabButton);
    }
  }
});

async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "lost-and-found");

  const response = await fetch("https://api.cloudinary.com/v1_1/dbcgpoclo/image/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.secure_url;
}

if (lostForm) {
  lostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = lostForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to report.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      return;
    }

    try {
      const imageFile = document.getElementById("lostImage").files[0];
      const imageUrl = imageFile ? await uploadImageToCloudinary(imageFile) : "";

      const docData = {
        title: document.getElementById("lostTitle").value,
        location: document.getElementById("lostLocation").value,
        description: document.getElementById("lostDescription").value,
        contact: document.getElementById("lostContact").value,
        date: document.getElementById("lostDate").value,
        imageUrl,
        type: "lost",
        uid: user.uid,
        timestamp: Date.now(),
      };

      await addDoc(collection(db, "items"), docData);
      e.target.reset();

      localStorage.setItem("activeTab", "profile");
      window.location.reload();

      if (localStorage.getItem("activeTab") === "profile" && auth.currentUser) {
        loadUserItems(auth.currentUser.uid);
      }

    } catch (err) {
      alert("Error submitting item. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
}

if (foundForm) {
  foundForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = foundForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to report.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      return;
    }

    try {
      const imageFile = document.getElementById("foundImage").files[0];
      const imageUrl = imageFile ? await uploadImageToCloudinary(imageFile) : "";

      const docData = {
        title: document.getElementById("foundTitle").value,
        location: document.getElementById("foundLocation").value,
        description: document.getElementById("foundDescription").value,
        contact: document.getElementById("foundContact").value,
        date: document.getElementById("foundDate").value,
        imageUrl,
        type: "found",
        uid: user.uid,
        timestamp: Date.now(),
      };

      await addDoc(collection(db, "items"), docData);
      e.target.reset();

      localStorage.setItem("activeTab", "profile");
      window.location.reload();

      if (localStorage.getItem("activeTab") === "profile" && auth.currentUser) {
        loadUserItems(auth.currentUser.uid);
      }

    } catch (err) {
      alert("Error submitting item. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
}

onSnapshot(collection(db, "items"), (snapshot) => {
  lostItems.innerHTML = "";
  foundItems.innerHTML = "";

  snapshot.forEach((doc) => {
    const item = doc.data();
    const div = document.createElement("div");
    div.className = "item-box" + (item.type === "found" ? " found" : "");
    div.innerHTML = `
      <h3>${item.title}</h3>
      ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="width:100%; max-height:150px; object-fit:cover; border-radius:6px;" />` : ""}
      <p style="font-size: 0.85em; color: #777;">Click for details</p>
    `;

    div.addEventListener("click", () => {
      showItemPopup(item);
    });

    if (item.type === "lost") {
      lostItems.appendChild(div);
    } else {
      foundItems.appendChild(div);
    }
  });
});

// Function to load and display user's posted items in their profile
async function loadUserItems(uid) {
  const userItemsHTML = (await getDocs(query(collection(db, "items"), where("uid", "==", uid))))
    .docs.map(doc => {
      const item = doc.data();
      return `
        <div class="item-box ${item.type}">
          <h3>${item.title}</h3>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="width:100%; max-height:150px; object-fit:cover; border-radius:6px;" />` : ""}
          <div class="item-actions">
            <button class="edit-btn" data-id="${doc.id}" data-type="${item.type}">Edit</button>
            <button class="delete-btn" data-id="${doc.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

  // Create wrapper for user items section
  const wrapper = `
    <div style="margin-top:20px;">
      <h3 style="font-size:16px;">Your Posted Items</h3>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:10px;">
        ${userItemsHTML}
      </div>
    </div>
  `;

  // Update profile content with user items
  const container = document.createElement('div');
  container.innerHTML = wrapper;

  const existingItems = document.querySelector('#profileContent .item-box')?.parentNode?.parentNode;
  if (existingItems) existingItems.remove();
  profileContent.appendChild(container);

  // Attach event listeners to item buttons
  attachItemButtons(uid);
}

// Function to attach event listeners to edit and delete buttons for user items
function attachItemButtons(uid) {
  // Handle delete button clicks
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('Are you sure you want to delete this item?')) {
        await deleteDoc(doc(db, "items", id));
        alert("Item deleted.");
        loadUserItems(uid);
      }
    });
  });

  // Handle edit button clicks
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      const docSnap = await getDoc(doc(db, "items", id));
      const item = docSnap.data();

      // Switch to appropriate form tab
      showTab(type === 'lost' ? 'reportlost' : 'reportfound', document.querySelector(`.tab-button[onclick*="${type}"]`));

      // Populate form with item data
      document.getElementById(`${type}Title`).value = item.title;
      document.getElementById(`${type}Location`).value = item.location;
      document.getElementById(`${type}Description`).value = item.description;
      document.getElementById(`${type}Contact`).value = item.contact;
      document.getElementById(`${type}Date`).value = item.date;

      const form = document.getElementById(`${type}Form`);

      // Handle form submission for updates
      newForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updatedData = {
          title: document.getElementById(`${type}Title`).value,
          location: document.getElementById(`${type}Location`).value,
          description: document.getElementById(`${type}Description`).value,
          contact: document.getElementById(`${type}Contact`).value,
          date: document.getElementById(`${type}Date`).value,
        };

        // Handle image upload if new image is provided
        const imageFile = document.getElementById(`${type}Image`).files[0];
        if (imageFile) {
          updatedData.imageUrl = await uploadImageToCloudinary(imageFile);
        }

        // Update item in Firestore
        await setDoc(doc(db, "items", id), { ...item, ...updatedData });
        alert("Item updated.");
        newForm.reset();
        showTab("profile", document.querySelector(".tab-button[onclick*='profile']"));
        loadUserItems(uid);
      });
    });
  });
}

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Get or create user document
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // Create new user document if it doesn't exist
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Anonymous",
        contact: "Not set",
        location: "Not set",
        photoURL: user.photoURL || "",
        createdAt: Date.now()
      });
    }

    const userData = (await getDoc(userRef)).data();

    // Create profile form with user data
    profileContent.innerHTML = `
      <form id="profileForm" class="report-form">
        ${userData.photoURL ? `<img src="${userData.photoURL}" alt="Profile Picture" id="previewImage" style="width:100px; height:100px; border-radius:50%; margin-bottom:10px;">` : ""}
        <label for="newPhoto">Profile Picture</label>
        <input type="file" id="newPhoto" accept="image/*" />

        <label for="profileName">Name</label>
        <input type="text" id="profileName" value="${userData.displayName || ''}" required />

        <label for="profileEmail">Email</label>
        <input type="email" id="profileEmail" value="${userData.email}" readonly />

        <label for="profileContact">Contact</label>
        <input type="text" id="profileContact" value="${userData.contact || ''}" />

        <label for="profileLocation">Location</label>
        <input type="text" id="profileLocation" value="${userData.location || ''}" />

        <button type="submit">Save Changes</button>
      </form>
    `;

    // Handle profile form submission
    document.getElementById("profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const saveBtn = document.querySelector("#profileForm button[type='submit']");
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving changes...";

      // Get form values
      const name = document.getElementById("profileName").value;
      const contact = document.getElementById("profileContact").value;
      const location = document.getElementById("profileLocation").value;
      const newPhotoFile = document.getElementById("newPhoto").files[0];

      // Handle profile picture upload
      let photoURL = userData.photoURL || "";
      if (newPhotoFile) {
        try {
          photoURL = await uploadImageToCloudinary(newPhotoFile);
        } catch (err) {
          alert("Image upload failed. Please try again.");
          saveBtn.disabled = false;
          saveBtn.textContent = "Save Changes";
          return;
        }
      }

      // Update user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        contact,
        location,
        photoURL,
        createdAt: userData.createdAt || Date.now()
      });

      alert("Profile updated successfully!");

      // Update profile picture preview
      if (newPhotoFile && photoURL) {
        const previewImage = document.getElementById("previewImage");
        if (previewImage) {
          previewImage.src = photoURL;
        } else {
          const img = document.createElement("img");
          img.id = "previewImage";
          img.src = photoURL;
          img.alt = "Profile Picture";
          img.style.width = "100px";
          img.style.height = "100px";
          img.style.borderRadius = "50%";
          img.style.marginBottom = "10px";
          document.getElementById("profileForm").insertBefore(img, document.getElementById("newPhoto"));
        }
      }

      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }, { once: true });

    // Load user items and update notification counter
    await loadUserItems(user.uid);
    updateNotificationCounter(user.uid);
  } else {
    profileContent.innerHTML = `<p>Please log in to view your profile.</p>`;
  }
});

// Sign out modal elements
const modal = document.getElementById("signOutModal");
const confirmBtn = document.getElementById("confirmLogout");
const cancelBtn = document.getElementById("cancelLogout");

// Handle sign out button click
document.querySelector('button[onclick*="signout"]').addEventListener("click", (e) => {
  e.preventDefault();
  modal.style.display = "flex";
});

// Handle sign out confirmation
confirmBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// Handle sign out cancellation
cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
  localStorage.setItem("activeTab", "home");
  showTab("home", document.querySelector(".tab-button:first-child"));
});

// Initialize tab state on page load
window.addEventListener('DOMContentLoaded', () => {
  const savedTab = localStorage.getItem('activeTab') || 'home';

  const tabButton = Array.from(document.querySelectorAll('.tab-button'))
    .find(btn => btn.textContent.toLowerCase().replace(/\s+/g, "") === savedTab);

  showTab(savedTab, tabButton);
});

// Handle cancel button clicks
document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("cancel-btn")) {
    const form = e.target.closest("form");
    if (form) form.reset();

    const homeTabButton = Array.from(document.querySelectorAll(".tab-button"))
      .find(btn => btn.textContent.trim().toLowerCase() === "home");

    if (homeTabButton) {
      showTab("home", homeTabButton);
    }
  }
});

// Function to display item details in a popup
function showItemPopup(item) {
  currentPopupItem = item;

  // Update popup content with item details
  document.getElementById("popupTitle").textContent = item.title;
  document.getElementById("popupImage").src = item.imageUrl || "";
  document.getElementById("popupImage").style.display = item.imageUrl ? "block" : "none";
  document.getElementById("popupDescription").textContent = item.description;
  document.getElementById("popupLocation").textContent = item.location;
  document.getElementById("popupContact").textContent = item.contact;
  document.getElementById("popupDate").textContent = item.date;

  // Handle "Check Item" button visibility based on item ownership
  const checkItemBtn = document.getElementById("checkItemBtn");
  const user = auth.currentUser;

  if (user && user.uid === item.uid) {
    checkItemBtn.style.display = "none";
  } else {
    checkItemBtn.style.display = "inline-block";
    checkItemBtn.disabled = false;
    checkItemBtn.textContent = "Check Item";
  }

  // Show the popup
  document.getElementById("itemPopup").style.display = "flex";
}

// Close popup when close button is clicked
document.getElementById("closePopup").addEventListener("click", () => {
  document.getElementById("itemPopup").style.display = "none";
});

// Get reference to the "Check Item" button
const checkItemBtn = document.getElementById("checkItemBtn");

// Handle "Check Item" button click to send notification to item owner
checkItemBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to check this item.");
    return;
  }

  if (!currentPopupItem || !currentPopupItem.uid) {
    alert("No item selected or item data is incomplete.");
    return;
  }

  if (currentPopupItem.uid === user.uid) {
    alert("You can't check your own item.");
    return;
  }

  // Disable button and show loading state
  checkItemBtn.disabled = true;
  checkItemBtn.textContent = "Request Sent...";

  try {
    // Create notification in Firestore
    await addDoc(collection(db, "notifications"), {
      to: currentPopupItem.uid,
      message: `${user.displayName || "Someone"} is interested in the item "${currentPopupItem.title}".`,
      timestamp: Date.now(),
      seen: false
    });

    alert("Notification sent to the item owner.");
    document.getElementById("itemPopup").style.display = "none";
  } catch (err) {
    console.error("Failed to send notification:", err);
    alert("Failed to send notification.");
    checkItemBtn.disabled = false;
    checkItemBtn.textContent = "Check Item";
  }
});

// Get references to notification UI elements
const notificationBtn = document.getElementById("notificationBtn");
const notificationPopup = document.getElementById("notificationPopup");
const notificationCount = document.getElementById("notificationCount");
let unseenCount = 0;

// Function to update the notification counter badge
function updateNotificationCounter(userId) {
  // Query notifications for the current user
  const q = query(
    collection(db, "notifications"),
    where("to", "==", userId)
  );

  // Listen for real-time updates to notifications
  onSnapshot(q, (snapshot) => {
    const unseen = snapshot.docs.filter(doc => !doc.data().seen);
    unseenCount = unseen.length;

    // Update notification badge
    if (unseenCount > 0) {
      notificationCount.textContent = unseenCount;
      notificationCount.style.display = "inline";
    } else {
      notificationCount.style.display = "none";
    }
  });
}

// Handle notification bell button click
notificationBtn.addEventListener("click", async () => {
  const isVisible = notificationPopup.style.display === "block";
  notificationPopup.style.display = isVisible ? "none" : "block";

  if (auth.currentUser) {
    await loadNotifications(auth.currentUser.uid);
    updateNotificationCounter(auth.currentUser.uid);
  }
});

// Close notification popup when clicking outside
document.addEventListener("click", (e) => {
  const bellClicked = notificationBtn.contains(e.target);
  const popupClicked = notificationPopup.contains(e.target);

  if (!bellClicked && !popupClicked) {
    notificationPopup.style.display = "none";
  }
});

// Function to load and display user notifications
function loadNotifications(userId) {
  // Query notifications for the current user
  const q = query(
    collection(db, "notifications"),
    where("to", "==", userId)
  );

  getDocs(q).then(snapshot => {
    notificationPopup.innerHTML = "";

    // Count unseen notifications
    let unseenCount = 0;
    const allNotifs = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      if (!data.seen) unseenCount++;
      return {
        id: docSnap.id,
        ...data
      };
    });

    // Create notification summary header
    const summary = document.createElement("div");
    summary.style.padding = "10px";
    summary.style.fontWeight = "bold";
    summary.style.color = "black";
    summary.textContent = unseenCount === 0
      ? "All notifications seen"
      : `${unseenCount} new notification${unseenCount > 1 ? "s" : ""}`;
    notificationPopup.appendChild(summary);

    // Sort notifications by timestamp (newest first)
    allNotifs.sort((a, b) => b.timestamp - a.timestamp);

    // Create notification items
    allNotifs.forEach(notif => {
      const div = document.createElement("div");
      div.className = "notification-item";
      div.textContent = notif.message;

      // Style unseen notifications differently
      if (!notif.seen) {
        div.style.fontWeight = "bold";
        div.style.backgroundColor = "#f9f9f9";
      }

      // Handle notification click
      div.addEventListener("click", async () => {
        alert("Notification clicked:\n" + notif.message);
        notificationPopup.style.display = "none";

        // Mark notification as seen
        await updateDoc(doc(db, "notifications", notif.id), {
          seen: true
        });
      });

      notificationPopup.appendChild(div);
    });
  });
}
