/////////////////////
///// VARIABLES
////////////////////

let lastPushedSerieFilter = undefined;
let lastPushedMovieFilter = undefined;
let currentPreview = undefined;

/**
 * The MovieDB Object.
 */
const TheMovieDB = {};

/**
 * All genres is registered here.
 */
const Genres = {
  movie: [],
  serie: []
};

/**
 * All movies is registered here.
 */
const Movies = {
  now: [],
  discover: [],
  popular: [],
  topRated: [],
  upComing: []
};

/**
 * All series is registered here.
 */
const Series = {
  discover: []
};

/**
 * All promises is registered here.
 */
const Promises = {
  movie: {},
  serie: {}
};

/**
 * Settings of the application
 */
const Settings = {
  debug: false,
  api: {
    language: "en",
    key: "c0899f4d6321bdbd97b6173b1b1341d5",
    endpoint: "https://api.themoviedb.org/3/"
  }
};

/////////
// AGE
////////

// TODO: Rewrite to use modal.
if (localStorage.getItem("ageVerified")) {
  document.body.classList.remove("d-none");
} else {
  let age = +prompt("How old are you?");
  if (age < 18) {
    localStorage.setItem("ageVerified", false);
    window.location.href = "https://www.themoviedb.org/?language=fr";
  } else {
    localStorage.setItem("ageVerified", true);
    document.body.classList.remove("d-none");
  }
}

/////////
// RGPD
////////

const privacyBanner = document.querySelector(".banner-privacy");
// If privacyBanner not exist, we show the banner, else we hide the banner
if (!localStorage.privacyBanner) {
  privacyBanner.style.display = "block";
} else {
  privacyBanner.style.display = "none";
}

// Handle click event
document.querySelector(".privacy-accept").addEventListener("click", event => {
  event.preventDefault(); // Disable default behavior
  privacyBanner.style.display = "none";
  localStorage.privacyBanner = true; // Set privacyBanner to true
});

/////////////////////////////
// SCROLL UP BUTTON & NAVBAR
/////////////////////////////

// Create scroll-up button
let button = document.createElement("span");
button.innerHTML = '<i class="fas fa-arrow-up"></i>';
button.classList.add("scroll-up");
// Append 'button' to body
document.body.appendChild(button);

const scroll = document.querySelector(".scroll-up");
const navbar = document.querySelector(".navbar");
window.onscroll = () => {
  // If 'scrollTop' >= 20, We show the scroll-up button, else we hide the button.
  if (document.body.scrollTop >= 20 || document.documentElement.scrollTop > 20) {
    scroll.style.opacity = 1;
  } else {
    scroll.style.opacity = 0;
  }

  // If 'scrollTop' >= 200, We hide the navbar, else we show the navbar with fade animation
  if (document.body.scrollTop >= 200 || document.documentElement.scrollTop > 200) {
    $(navbar).fadeOut("fast");
  } else {
    $(navbar).fadeIn("fast");
  }
};

// Handle click from 'scroll' button.
scroll.addEventListener("click", event => {
  event.preventDefault(); // Disable default behavior
  // Scroll to 0 with behavior smooth
  window.scroll({
    top: 0,
    behavior: "smooth"
  });
});

////////////////////
///// THE MOVIE DB
///////////////////

TheMovieDB.delay = $ms => new Promise($resolve => setTimeout($resolve, $ms)); // ONLY FOR DEV!
TheMovieDB.image = ($path, $size = "original") => `https://image.tmdb.org/t/p/${$size}/${$path}`;
TheMovieDB.request = async ($endpoint, $query = {}, $options = {}) => {
  const url = new URL($endpoint.replace(":id", $query.id), Settings.api.endpoint);
  const params = new URLSearchParams({
    api_key: Settings.api.key,
    language: $query.language ? $query.language : Settings.api.language,
    ...$query.params
  }).toString();

  return await fetch(`${url}?${params}`, $options).then($response => $response.json());
};

//////////////////////
///// REQUEST GENRES
/////////////////////

Promises.movie.genre = TheMovieDB.request("genre/movie/list").then($response => {
  if (Settings.debug) console.log("Genre:Movie", $response.genres);
  $response.genres.forEach($genre => {
    Genres.movie[$genre.id] = $genre.name;
  });

  footerReviewMovie("#footer-review-movie-target", "#footer-review-movie-template");
});

Promises.serie.genre = TheMovieDB.request("genre/tv/list").then($response => {
  if (Settings.debug) console.log("Genre:Serie", $response.genres);
  $response.genres.forEach($genre => {
    Genres.serie[$genre.id] = $genre.name;
  });
});

///////////////////
// REQUEST MOVIES
//////////////////

Promises.movie.now = TheMovieDB.request("movie/now_playing").then($response => {
  if (Settings.debug) console.log("Movie:Now", $response.results);
  Promise.all([Promises.movie.genre]).then(() => {
    $response.results.forEach($movie => {
      Movies.now.push($movie);
    });

    listMovies("movie", $response.results, "#movie-now-target", "#movie-now-template", null, 0, 5);
  });
});

Promises.movie.discover = TheMovieDB.request("discover/movie").then($response => {
  if (Settings.debug) console.log("Movie:Discover", $response.results);
  Promise.all([Promises.movie.genre]).then(() => {
    $response.results.forEach($movie => {
      Movies.discover.push($movie);
    });

    listMovies("movie", $response.results, "#movie-featured-target", "#movie-featured-template", "#movie-featured-extra-content", 0, 18);
  });
});

Promises.movie.popular = TheMovieDB.request("movie/popular").then($response => {
  if (Settings.debug) console.log("Movie:Popular", $response.results);
  Promise.all([Promises.movie.genre]).then(() => {
    $response.results.forEach($movie => {
      Movies.popular.push($movie);
    });

    createCarousel($response.results, "#carousel-target", "#carousel-template", 3);
  });
});

Promises.movie.popular = TheMovieDB.request("movie/upcoming").then($response => {
  if (Settings.debug) console.log("Movie:Upcoming", $response.results);
  Promise.all([Promises.movie.genre]).then(() => {
    $response.results.forEach($movie => {
      Movies.upComing.push($movie);
    });

    footerLatestMovie($response.results, "#footer-latest-movie-target", "#footer-latest-movie-template", 4);
    createShop($response.results, "#shop-movies-target", "#shop-movies-template", 8, 16);
  });
});

Promises.movie.popular = TheMovieDB.request("movie/top_rated").then($response => {
  if (Settings.debug) console.log("Movie:Top", $response.results);
  Promise.all([Promises.movie.genre]).then(() => {
    $response.results.forEach($movie => {
      Movies.topRated.push($movie);
    });

    footerTopRatedMovie($response.results, "#footer-top-rated-target", "#footer-top-rated-template", 6);
  });
});

///////////////////
// REQUEST SERIES
//////////////////

Promises.serie.discover = TheMovieDB.request("discover/tv").then($response => {
  if (Settings.debug) console.log("Serie:Discover", $response.results);
  Promise.all([Promises.serie.genre]).then(() => {
    $response.results.forEach($serie => {
      Series.discover.push($serie);
    });

    listMovies("serie", $response.results, "#serie-featured-target", "#serie-featured-template", "#serie-featured-extra-content", 0, 18);
  });
});

////////////////
// APPLICATION
///////////////

/**
 * This function is used to create dynamically the carousel.
 * @param {Object} $resources
 * @param {String} $target
 * @param {String} $template
 * @param {Number} $amount
 */
const createCarousel = ($resources, $target, $template, $amount = 10) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  // forEach from 0 to $amount (max)
  $resources.slice(0, $amount).forEach($resource => {
    // 'main' is a clone from 'template'
    let main = template.cloneNode(true).content,
      image = main.querySelector("img"),
      title = main.querySelector("#title"),
      link = main.querySelector("#link"),
      overview = main.querySelector("#overview");

    // Add content to all elements
    title.innerHTML = $resource.title;
    overview.innerHTML = $resource.overview;

    // Set attribute to all elements
    link.setAttribute("data-toggle", "modal");
    link.setAttribute("data-target", "#watch-modal");
    link.setAttribute("title", $resource.title);
    image.setAttribute("src", TheMovieDB.image($resource.backdrop_path, "original"));
    // Handle click event from 'link' and attach the correct trailer with attachTrailer()
    link.addEventListener("click", e => {
      e.preventDefault(); // Disable default behavior
      watchTrailer($resource.id);
    });

    // Append 'main' to 'target'
    target.appendChild(main);
  });
};

/**
 * This function is used to create the shop.
 * @param {Object} $resources
 * @param {String} $target
 * @param {String} $template
 * @param {Number} $index
 * @param {Number} $amount
 * @param {Boolean} $cleanup
 */
const createShop = ($resources, $target, $template, $index = 0, $amount = 8, $cleanup = false) => {
  let target = document.querySelector($target),
    template = document.querySelector($template),
    displayed = 0; // reset 'displayed'

  // If '$cleanup' is true, we remove all content in 'target'
  if ($cleanup) target.innerHTML = "";
  // forEach from $index (min) to $amount (max)
  $resources.slice($index, $amount).forEach($resource => {
    displayed++; // Increment 'displayed' by 1.
    // 'main' is a clone from 'template'
    let main = template.cloneNode(true).content,
      div = main.querySelector("#shop-item"),
      title = main.querySelector("#title"),
      image = main.querySelector("img"),
      year = main.querySelector("#year"),
      price = main.querySelector("#price"),
      random = Math.floor(Math.random() * 19.99) + 1.99;

    // If displayed is equal to 1, we attach a preview to the first elements
    if (displayed === 1) attachPreview($resources[$index].id, random);

    // Add content to all elements
    title.innerHTML = $resource.title;
    year.innerHTML = $resource.release_date.substr(0, 4);
    price.innerHTML = `${random}$`;

    // Set attribute to elements
    div.setAttribute("data-movie", $resource.id);
    image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w300"));
    image.setAttribute("alt", $resource.title);

    // Handle click on 'div' and attach a preview with attachPreview()
    // When click is handled, we redirect the user to #shop-preview anchor
    div.addEventListener("click", event => {
      attachPreview($resource.id, random);
      window.location = "#shop-preview";
    });

    // Append 'main' to 'target'
    target.appendChild(main);
  });
};

/**
 * This function is used to attach the preview with the selected movie.
 * @param {Number} $id
 * @param {Number} $price
 */
const attachPreview = ($id, $price) => {
  let preview = document.getElementById("shop-preview"),
    title = preview.querySelector("#title"),
    overview = preview.querySelector("#overview"),
    trailer = preview.querySelector("iframe#preview-trailer"),
    image = preview.querySelector("img"),
    release = preview.querySelector("#release"),
    genres = preview.querySelector("#genres"),
    price = preview.querySelector("#price");

  // If 'currentPreview is equal to '$id', we dont process the request.
  if (currentPreview != $id) {
    // Request all data for the selected movie
    TheMovieDB.request("movie/:id", {
      id: $id,
      params: {
        append_to_response: ["videos", "casts"]
      }
    }).then($response => {
      if (Settings.debug) console.log("Movie:Detail", $response);

      // Filter all videos results to retrieve only the video from youtube and when type is Trailer.
      let videos = $response.videos.results.filter(video => (video.site === "YouTube" && video.type === "Trailer" ? video : null));
      if (videos.length >= 1) {
        // Hide the image
        image.classList.add("d-none");
        // Show the trailer
        trailer.classList.remove("d-none");
        // Set attribute src to 'trailer'
        trailer.setAttribute("src", `https://www.youtube-nocookie.com/embed/${videos[0].key}?modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&color=white&controls=0&disablekb=1`);
      } else {
        // Show the image
        image.classList.remove("d-none");
        // Set attribute src and alt to 'image'
        image.setAttribute("src", TheMovieDB.image($response.backdrop_path));
        image.setAttribute("alt", $response.title);

        // Hide the trailer
        trailer.classList.add("d-none");
      }

      // Here, we inject the content in preview.
      if (title) title.innerHTML = $response.title;
      if (overview) overview.innerHTML = $response.overview;
      if (release) release.innerHTML = new Date($response.release_date).toISOString().split("T")[0];
      if (price && $price != null) price.innerHTML = `${$price}$`;

      // Set current preview has $id
      currentPreview = $id;
    });
  }
};

/**
 * This function is used to attach the modal box to the selected video.
 * @param {Number} $id
 * @param {String} $type
 */
const attachModal = ($id, $type) => {
  let modal = document.getElementById("detail-modal"),
    title = modal.querySelector(".modal-title"),
    overview = modal.querySelector(".modal-body #overview"),
    trailer = modal.querySelector("iframe#trailer"),
    release = modal.querySelector("#release"),
    casts = modal.querySelector("#casts"),
    crews = modal.querySelector("#crews"),
    genres = modal.querySelector("#genres");

  // Request all data for the selected movie/serie
  TheMovieDB.request($type === "movie" ? "movie/:id" : "tv/:id", {
    id: $id,
    params: {
      append_to_response: ["videos", "images", "casts"]
    }
  }).then($response => {
    if (Settings.debug) console.log($type === "movie" ? "Movie:Detail" : "Serie:Detail", $response);

    // Add content to all elements
    if (title) title.innerHTML = $type === "movie" ? $response.title : $response.name;
    if (overview) overview.innerHTML = $response.overview;
    release.innerHTML = $type === "movie" ? `Release date: ${$response.release_date.slice(0, 4)}` : `First broadcast: ${$response.first_air_date.slice(0, 4)}`;

    // Filter all videos results to retrieve only the video from youtube and when type is Trailer.
    let videos = $response.videos.results.filter(video => (video.site === "YouTube" && video.type === "Trailer" ? video : null));
    if (videos.length >= 1) {
      // Show the trailer
      trailer.classList.remove("d-none");
      // Set attribute src to 'trailer'
      trailer.setAttribute("src", `https://www.youtube-nocookie.com/embed/${videos[0].key}?modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&color=white&controls=0&disablekb=1`);
      $(modal).on("hidden.bs.modal", () => {
        trailer.removeAttribute("src"); // When modal is closed, reset the src attribute.. it's used to ensure the trailer video stop when modal is closed
      });
    } else {
      // Hide the trailer if nothing video was found
      trailer.classList.add("d-none");
    }

    // If the genres are >= to 1, we inject all the genres by creating each span separately
    if ($response.genres.length >= 1) {
      genres.innerHTML = "Genres: ";
      $response.genres.forEach($genre => {
        let span = document.createElement("span");
        span.classList.add("badge", "badge-default");
        span.appendChild(document.createTextNode($genre.name));

        // Append 'span' to 'genres'
        genres.appendChild(span);
      });
    }

    // If the '$type' is movie and cast are >= to 1, we inject only 4 casts
    if ($type === "movie" && $response.casts.cast.length >= 1) {
      casts.innerHTML = "Casts: ";
      $response.casts.cast.slice(0, 4).forEach($cast => {
        let span = document.createElement("span");
        span.classList.add("badge", "badge-default");
        span.appendChild(document.createTextNode($cast.name));

        // Append 'span' to 'casts'
        casts.appendChild(span);
      });
    }

    // If the '$type' is movie and crew are >= to 1, we inject only 1 crew (director)
    if ($type === "movie" && $response.casts.crew.length >= 1) {
      crews.innerHTML = "Director: ";
      $response.casts.crew.slice(0, 1).forEach($crew => {
        let span = document.createElement("span");
        span.classList.add("badge", "badge-default");
        span.appendChild(document.createTextNode($crew.name));

        // Append 'span' to 'crews'
        crews.appendChild(span);
      });
    }
  });
};

/**
 * This function is used to list all movies recovered via API requests.
 * @param {String} $type
 * @param {Object} $resources
 * @param {String} $target
 * @param {String} $template
 * @param {String} $extra
 * @param {Number} $index
 * @param {Number} $amount
 */
const listMovies = ($type, $resources, $target, $template, $extra, $index = 0, $amount = 20) => {
  let target = document.querySelector($target),
    template = document.querySelector($template),
    extra = target.querySelector($extra),
    displayed = 0; // Reset 'displayed'
  $(extra).hide(); // Hide extra content by default.

  // forEach from $index (min) to $amount (max)
  $resources.slice($index, $amount).forEach($resource => {
    displayed++; // Increment 'displayed' by 1.

    // main is a clone from 'template'
    const main = template.cloneNode(true).content,
      item = main.querySelector("#item"),
      title = main.querySelector("#title"),
      image = main.querySelector("img"),
      year = main.querySelector("#year"),
      genre = main.querySelector("#genre");

    // Add content to all elements
    if (title) title.innerHTML = $type === "movie" ? $resource.title : $resource.name;
    if (image) image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w500"));
    if (image) image.setAttribute("alt", $resource.title);
    if (year) year.appendChild(document.createTextNode($type === "movie" ? $resource.release_date.substr(0, 4) : $resource.first_air_date.substr(0, 4)));
    if ($resource.genre_ids.length >= 1) {
      if (genre) genre.appendChild(document.createTextNode($type === "movie" ? Genres.movie[$resource.genre_ids[0]] : Genres.serie[$resource.genre_ids[0]]));
      item.setAttribute("data-genre", $resource.genre_ids[0]);
    }

    // Set attribute toggle and target to handle the modal attached with attachModal function.
    item.setAttribute("data-toggle", "modal");
    item.setAttribute("data-target", "#detail-modal");
    item.addEventListener("click", () => attachModal($resource.id, $type));

    // Add extra content > 12 items to the 'extra' selector
    if (displayed > 12) {
      extra.appendChild(main);
      target.appendChild(extra);
    } else {
      target.appendChild(main);
    }
  });

  // remove 'template'
  template.remove();
};

/**
 * This function is used to attach and display the trailer from the selected movie in a modal box.
 * @param {Number} $id
 */
const watchTrailer = $id => {
  let modal = document.getElementById("watch-modal"),
    trailer = modal.querySelector("iframe#trailer");

  // Request all data for the selected movie ($id)
  TheMovieDB.request("movie/:id", {
    id: $id,
    params: {
      append_to_response: ["videos"]
    }
  }).then($response => {
    if (Settings.debug) console.log("Movie:Detail", $response);

    // Filter all videos results to retrieve only the video from youtube and when type is Trailer.
    let videos = $response.videos.results.filter(video => (video.site === "YouTube" && video.type === "Trailer" ? video : null));
    if (videos.length >= 1) {
      // Set attribute src to 'trailer'
      trailer.setAttribute("src", `https://www.youtube-nocookie.com/embed/${videos[0].key}?modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&color=white&controls=0&disablekb=1&autoplay=1`);
      $(modal).on("hidden.bs.modal", () => {
        trailer.removeAttribute("src"); // When modal is closed, reset the src attribute.. it's used to ensure the trailer video stop when modal is closed
      });
    }
  });
};

/**
 * This function is used to create dynamically the latest movie section in footer.
 * @param {Object} $resources
 * @param {String} $target
 * @param {String} $template
 * @param {Number} $amount
 */
const footerLatestMovie = ($resources, $target, $template, $amount = 4) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);

  // forEach from 0 to $amount (max)
  $resources.slice(0, $amount).forEach($resource => {
    // main is a clone from 'template'
    const main = template.cloneNode(true).content,
      image = main.querySelector("img"),
      title = main.querySelector("#title");

    // Add content to all elements
    title.innerHTML = $resource.title;
    image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w300"));
    image.setAttribute("alt", $resource.title);

    // append 'main' to 'target'
    target.appendChild(main);
  });
};

/**
 * This function is used to create dynamically the review movie section in footer.
 * @param {String} $target
 * @param {String} $template
 */
const footerReviewMovie = ($target, $template) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  Genres.movie.forEach($genre => {
    // main is a clone from 'template'
    const main = template.cloneNode(true).content,
      link = main.querySelector("a#link");

    // Add text to link and set href attribute.
    link.innerHTML = $genre;
    link.setAttribute("href", `#${$genre}`);

    // Append 'main' to 'target'
    target.appendChild(main);
  });
};

/**
 * This function is used to create dynamically the top rated section movie in footer.
 * @param {Object} $resources
 * @param {String} $target
 * @param {String} $template
 * @param {Number} $amount
 */
const footerTopRatedMovie = ($resources, $target, $template, $amount = 6) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);

  // forEach from 0 to $amount (max)
  $resources.slice(0, $amount).forEach($resource => {
    // main is a clone from 'template'
    const main = template.cloneNode(true).content,
      image = main.querySelector("img");

    // Set src and alt attribute for 'image'
    image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w500"));
    image.setAttribute("alt", $resource.title);

    // Append image to target
    target.appendChild(image);
  });
};

/**
 * This function is used to filter movie by genre.
 * @param {Number} $genre
 * @param {Object} $btn
 * @param {String} $selector
 * @param {String} $type
 */
const filterByGenre = ($genre, $btn, $selector, $type) => {
  if ($type === "movie") {
    if (lastPushedMovieFilter !== undefined) {
      lastPushedMovieFilter.classList.remove("btn-primary");
      lastPushedMovieFilter.classList.add("btn-light");
      lastPushedMovieFilter = undefined;
    }
  } else {
    if (lastPushedSerieFilter !== undefined) {
      lastPushedSerieFilter.classList.remove("btn-primary");
      lastPushedSerieFilter.classList.add("btn-light");
      lastPushedSerieFilter = undefined;
    }
  }

  document.querySelectorAll($selector).forEach(item => {
    item.classList.add("d-none");
    if (item.getAttribute("data-genre") == $genre || $genre == 0) {
      $btn.classList.remove("btn-light");
      $btn.classList.add("btn-primary");
      $type === "movie" ? (lastPushedMovieFilter = $btn) : (lastPushedSerieFilter = $btn);
      item.classList.remove("d-none");
    }
  });
};

/**
 * This function is used to show or less the extra content.
 * @param {String} $btn
 * @param {String} $selector
 */
const showMoreOrLess = ($btn, $selector) => {
  let button = document.querySelector($btn);
  let content = document.querySelector($selector);
  $(content).slideToggle("fast", "linear");
  if (button.innerHTML == "Show less") {
    button.innerHTML = "Show more";
  } else {
    button.innerHTML = "Show less";
  }
};

///////////////////
// EVENTS HANDLER
//////////////////

// FILTERS
Array.from(document.querySelectorAll("#movie-featured-filter-target button")).forEach($btn => $btn.addEventListener("click", () => (filterByGenre($btn.getAttribute("data-genre"), $btn, ".movie", "movie"), false)));
Array.from(document.querySelectorAll("#serie-featured-filter-target button")).forEach($btn => $btn.addEventListener("click", () => (filterByGenre($btn.getAttribute("data-genre"), $btn, ".serie", "serie"), false)));

// MORE OR LESS
document.getElementById("movie-featured-extra").addEventListener("click", () => showMoreOrLess("#movie-featured-extra", "#movie-featured-extra-content"));
document.getElementById("serie-featured-extra").addEventListener("click", () => showMoreOrLess("#serie-featured-extra", "#serie-featured-extra-content"));

// SHOP BUTTON
let rightButton = document.getElementById("shop-right");
rightButton.addEventListener("click", () => {
  // We create the shop starting from index: 0 and amount: 8, and cleanup the last result in shop.
  createShop(Movies.upComing, "#shop-movies-target", "#shop-movies-template", 0, 8, true);
  rightButton.disabled = true;
  leftButton.disabled = false;
});

let leftButton = document.getElementById("shop-left");
leftButton.addEventListener("click", () => {
  // We create the shop starting from index: 8 and amount: 16, and cleanup the last result in shop.
  createShop(Movies.upComing, "#shop-movies-target", "#shop-movies-template", 8, 16, true);
  rightButton.disabled = false;
  leftButton.disabled = true;
});

// CONTACT US
document.getElementById("form-contact").addEventListener("submit", event => {
  event.preventDefault(); // Disable default behavior.

  // Get all elements
  let modal = document.getElementById("contact-modal"),
    name = modal.querySelector("#fullname"),
    email = modal.querySelector("#email"),
    subject = modal.querySelector("#subject"),
    message = modal.querySelector("#message");

  // Insert data in correct elements.
  name.innerHTML = `${event.target[0].value} ${event.target[1].value}`;
  email.innerHTML = event.target[2].value;
  subject.innerHTML = event.target[3].value;
  message.innerHTML = event.target[4].value;

  // Showing the modal when all is ok..
  $(modal).modal("show");
});
