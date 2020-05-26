$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navCreateStory = $("#nav-create-story");
  const $navMyStories = $("#nav-my-stories");
  const $navFavorites = $("#nav-favorites");
  const $navLogOut = $("#nav-logout");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;``
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();
    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();

  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, owner) {
    let hostName = getHostName(story.url);
    //let starType = isFavorite(story) ? "fas" : "far";
    const trashCanIcon = owner
      ? `<span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>`
      : "";
    const fav = isFavorite(story.storyId) ? "fas" : "far";
    const storyMarkup = $(`
      <li id="${story.storyId}">
      ${trashCanIcon}
      <span class="star">
          <i class="${fav} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  function isFavorite(storyId) {
    let favoriteList = new Set();
    if (currentUser) {
      favoriteList = new Set(currentUser.favorites.map(fav => fav.storyId));
    }
    return favoriteList.has(storyId);
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navCreateStory.show();
    $navMyStories.show();
    $navFavorites.show();
    $navLogOut.show();
    showUserDetails();
  }

  function showUserDetails() {
    $('#profile-name').append("<span>" + currentUser.name + "</span>");
    $('#profile-username').append("<span>" + currentUser.username + "</span>");
    $('#profile-account-date').append("<span>" + new Date(Date.parse(currentUser.createdAt)).toDateString() + "</span>");
  }

  $navCreateStory.click(function() {
    $("#submit-form").toggle();
  })

  $navMyStories.click(function() {
    getMyStories();
  })

  $navFavorites.click(function() {
    getFavorites();
  })

  function getMyStories() {
    $ownStories.empty();
    $allStoriesList.hide();
    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h5>You haven't posted any stories yet.</h5>");
    } else {
      for(let story of currentUser.ownStories) {
        let ownHTML = generateStoryHTML(story, true);
        $ownStories.append(ownHTML);
      }
    }
    $ownStories.show();
  }

  function getFavorites() {
    $ownStories.empty();
    $allStoriesList.hide();
    if (currentUser.favorites.length === 0) {
      $ownStories.append("<h5>You haven't favorited any stories yet.</h5>");
    } else {
      for (let story of currentUser.favorites) {
          let favorite = generateStoryHTML(story, true);
          $ownStories.append(favorite);
      }
    }
    $ownStories.show();
  }

  $ownStories.on("click", ".trash-can", async function(evt) {
    const storyID = $(evt.target).closest("li").attr("id");
    await storyList.removeStory(currentUser, storyID);
    refreshStories();
  })

  $(".articles-container").on("click", ".star", async function(evt) {
    const storyID = $(evt.target).closest("li").attr("id");
    if ($(evt.target).hasClass("fas")) {
      await storyList.toggleFavorite(currentUser, storyID, 'DELETE');
    } else {
      await storyList.toggleFavorite(currentUser, storyID, 'POST');
    }
    refreshStories();
  })

  $("#submit-form").submit(async function(evt) {
      evt.preventDefault();
      let story = {
        author: evt.target[0].value,
        title: evt.target[1].value,
        url: evt.target[2].value,
      };
      await storyList.addStory(currentUser, story);
      refreshStories();
  });

  async function refreshStories() {
    await generateStories();
    hideElements();
    $allStoriesList.show();
  }

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
