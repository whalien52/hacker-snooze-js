const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  static async getStories() {
    const response = await axios.get(`${BASE_URL}/stories`);
    const stories = response.data.stories.map(story => new Story(story));
    const storyList = new StoryList(stories);
    return storyList;
  }

  async addStory(user, newStory) {
    let response = await axios({
      method: "POST",
      url: "https://hack-or-snooze-v3.herokuapp.com/stories",
      data: {
        story: newStory,
        token: user.loginToken,
      }
    });
    let addedStory = new Story(response.data.story);
    this.stories.unshift(addedStory);
    user.ownStories.unshift(addedStory);
    return addedStory;
  }

  async removeStory(user, storyID) {
    let response = await axios({
      method: "DELETE", 
      url: "https://hack-or-snooze-v3.herokuapp.com/stories/" + storyID,
      data: {
        token: user.loginToken
      },
    });
    this.stories = this.stories.filter(story => story.storyId !== storyID);
    user.ownStories = user.ownStories.filter(story => story.storyId !== storyID);
  }

  async toggleFavorite(user, storyID, postType) {
    let response = await axios({
      method: postType,
      url: "https://hack-or-snooze-v3.herokuapp.com/users/" +user.username+ "/favorites/" + storyID,
      data: {
        token: user.loginToken
      },
    });
    user.favorites = response.data.user.favorites.map(story => new Story(story));
    user.ownStories = response.data.user.stories.map(story => new Story(story));
  }
}
 


class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    const newUser = new User(response.data.user);
    newUser.loginToken = response.data.token;
    return newUser;
  }


  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    const existingUser = new User(response.data.user);
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    existingUser.loginToken = response.data.token;
    return existingUser;
  }

  static async getLoggedInUser(token, username) {
    if (!token || !username) return null;
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);
    existingUser.loginToken = token;
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }
}


class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}