/////////////////////
///// VARIABLES
////////////////////

let lastPushedSerieFilter = undefined;
let lastPushedMovieFilter = undefined;
let currentPreview = undefined;

const TheMovieDB = {};
const Genres = {
  movie: [],
  serie: []
};

const Movies = {
  now: [],
  discover: [],
  popular: [],
  topRated: [],
  upComing: []
};

const Series = {
  discover: []
};

const Promises = {
  movie: {},
  serie: {}
};

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
if (!localStorage.privacyBanner) {
  privacyBanner.style.display = "block";
} else {
  privacyBanner.style.display = "none";
}

document.querySelector(".privacy-accept").addEventListener("click", () => {
  privacyBanner.style.display = "none";
  localStorage.privacyBanner = true;
});

/////////////////////////////
// SCROLL UP BUTTON & NAVBAR
/////////////////////////////

let button = document.createElement("span");
button.innerHTML = '<i class="fas fa-arrow-up"></i>';
button.classList.add("scroll-up");
document.body.appendChild(button);

const scroll = document.querySelector(".scroll-up");
const navbar = document.querySelector(".navbar");
window.onscroll = () => {
  if (document.body.scrollTop >= 20 || document.documentElement.scrollTop > 20) {
    scroll.style.opacity = 1;
  } else {
    scroll.style.opacity = 0;
  }

  if (document.body.scrollTop >= 200 || document.documentElement.scrollTop > 200) {
    $(navbar).fadeOut("fast");
  } else {
    $(navbar).fadeIn("fast");
  }
};

scroll.addEventListener("click", event => {
  event.preventDefault();
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
  $response.results.forEach($movie => {
    Movies.popular.push($movie);
  });

  createCarousel($response.results, "#carousel-target", "#carousel-template", 3);
});

Promises.movie.popular = TheMovieDB.request("movie/upcoming").then($response => {
  if (Settings.debug) console.log("Movie:Upcoming", $response.results);
  $response.results.forEach($movie => {
    Movies.upComing.push($movie);
  });

  footerLatestMovie($response.results, "#footer-latest-movie-target", "#footer-latest-movie-template", 4);
  manageShop($response.results, "#shop-movies-target", "#shop-movies-template", 8, 16);
});

Promises.movie.popular = TheMovieDB.request("movie/top_rated").then($response => {
  if (Settings.debug) console.log("Movie:Top", $response.results);
  $response.results.forEach($movie => {
    Movies.topRated.push($movie);
  });

  footerTopRatedMovie($response.results, "#footer-top-rated-target", "#footer-top-rated-template", 6);
});

///////////////////
// REQUEST SERIES
//////////////////

Promises.serie.discover = TheMovieDB.request("discover/tv").then($response => {
  if (Settings.debug) console.log("Serie:Discover", $response.results);
  $response.results.forEach($serie => {
    Series.discover.push($serie);
  });

  listMovies("serie", $response.results, "#serie-featured-target", "#serie-featured-template", "#serie-featured-extra-content", 0, 18);
});

////////////////
// APPLICATION
///////////////

const createCarousel = ($resources, $target, $template, $amount = 10) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  $resources.slice(0, $amount).forEach($resource => {
    let main = template.cloneNode(true).content,
      image = main.querySelector("img"),
      title = main.querySelector("#title"),
      link = main.querySelector("#link"),
      overview = main.querySelector("#overview");

    title.innerHTML = $resource.title;
    overview.innerHTML = $resource.overview;
    image.setAttribute("src", TheMovieDB.image($resource.backdrop_path, "original"));

    TheMovieDB.request("movie/:id", {
      id: $resource.id,
      params: {
        append_to_response: ["videos"]
      }
    }).then($response => {
      let videos = $response.videos.results.filter(video => (video.site === "YouTube" && video.type === "Trailer" ? video : null));
      if (videos.length >= 1) {
        link.setAttribute("href", `https://www.youtube.com/watch?v=${videos[0].key}`);
      } else {
        link.classList.add("d-none");
      }
    });

    target.appendChild(main);
  });
};

const manageShop = ($resources, $target, $template, $index = 0, $amount = 8, $cleanup = false) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);

  if ($cleanup) target.innerHTML = "";
  attachPreview($resources[$index].id);
  $resources.slice($index, $amount).forEach($resource => {
    let main = template.cloneNode(true).content,
      div = main.querySelector("#shop-item"),
      title = main.querySelector("#title"),
      image = main.querySelector("img"),
      year = main.querySelector("#year"),
      price = main.querySelector("#price");

    div.setAttribute("data-movie", $resource.id);
    title.innerHTML = $resource.title;
    image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w300"));
    image.setAttribute("alt", $resource.title);
    year.innerHTML = $resource.release_date.substr(0, 4);
    price.innerHTML = `${Math.floor(Math.random() * 29) + 15}$`;

    div.addEventListener("click", event => attachPreview($resource.id, event));

    target.appendChild(main);
  });

  template.remove();
};

const attachPreview = ($id, $event) => {
  const preview = document.getElementById("shop-preview"),
    title = preview.querySelector("#title"),
    overview = preview.querySelector("#overview"),
    trailer = preview.querySelector("iframe#trailer");

  if (currentPreview != $id) {
    TheMovieDB.request("movie/:id", {
      id: $id,
      params: {
        append_to_response: ["videos", "casts"]
      }
    }).then($response => {
      if (Settings.debug) console.log("Movie:Detail", $response);

      let videos = $response.videos.results.filter(video => (video.site === "YouTube" && video.type === "Trailer" ? video : null));
      if (videos.length >= 1) {
        trailer.classList.remove("d-none");
        trailer.classList.add("d-block");
        trailer.setAttribute("src", `https://www.youtube-nocookie.com/embed/${videos[0].key}?modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&color=white&controls=0&disablekb=1`);
      } else {
        trailer.classList.remove("d-block");
        trailer.classList.add("d-none");
      }

      // Here, we inject the content in preview.
      if (title) title.innerHTML = $response.title;
      if (overview) overview.innerHTML = $response.overview;

      // Set current preview has $id
      currentPreview = $id;
    });
  }
};

const listMovies = ($type, $resources, $target, $template, $extra, $index = 0, $amount = 20) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  let extra = target.querySelector($extra);
  let displayed = 0;
  $(extra).hide();

  $resources.slice($index, $amount).forEach($resource => {
    displayed++;

    const main = template.cloneNode(true).content,
      item = main.querySelector("div#item"),
      title = main.querySelector("#title"),
      image = main.querySelector("img"),
      year = main.querySelector("#year"),
      genre = main.querySelector("#genre");

    if (title) title.innerHTML = $type === "movie" ? $resource.title : $resource.name;
    if (image) image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w500"));
    if (year) year.appendChild(document.createTextNode($type === "movie" ? $resource.release_date.substr(0, 4) : $resource.first_air_date.substr(0, 4)));
    if ($resource.genre_ids.length >= 1) {
      if (genre) genre.appendChild(document.createTextNode($type === "movie" ? Genres.movie[$resource.genre_ids[0]] : Genres.serie[$resource.genre_ids[0]]));
      item.setAttribute("data-genre", $resource.genre_ids[0]);
    }

    item.setAttribute("data-toggle", "modal");
    item.setAttribute("data-target", "#detail-modal");
    item.addEventListener("click", () => attachModal($resource.id, $type));

    if (displayed > 12) {
      extra.appendChild(main);
      target.appendChild(extra);
    } else {
      target.appendChild(main);
    }
  });

  template.remove();
};

const attachModal = ($id, $type) => {
  let modal = document.getElementById("detail-modal"),
    title = modal.querySelector(".modal-title"),
    overview = modal.querySelector(".modal-body #overview"),
    trailer = modal.querySelector("iframe#trailer"),
    release = modal.querySelector("#release"),
    casts = modal.querySelector("#casts"),
    crews = modal.querySelector("#crews"),
    genres = modal.querySelector("#genres");

  TheMovieDB.request($type === "movie" ? "movie/:id" : "tv/:id", {
    id: $id,
    params: {
      append_to_response: ["videos", "images", "casts"]
    }
  }).then($response => {
    if (Settings.debug) console.log($type === "movie" ? "Movie:Detail" : "Serie:Detail", $response);

    if (title) title.innerHTML = $type === "movie" ? $response.title : $response.name;
    if (overview) overview.innerHTML = $response.overview;
    release.innerHTML = $type === "movie" ? `Release date: ${$response.release_date.slice(0, 4)}` : `First broadcast: ${$response.first_air_date.slice(0, 4)}`;

    let videos = $response.videos.results.filter(video => (video.site === "YouTube" && video.type === "Trailer" ? video : null));
    if (videos.length >= 1) {
      trailer.classList.remove("d-none");
      trailer.classList.add("d-block");
      trailer.setAttribute("src", `https://www.youtube-nocookie.com/embed/${videos[0].key}?modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&color=white&controls=0&disablekb=1`);
      $(modal).on("hidden.bs.modal", () => {
        trailer.removeAttribute("src"); // When modal is closed, reset the src attribute.. it's used to ensure the trailer video stop when modal is closed
      });
    } else {
      trailer.classList.remove("d-block");
      trailer.classList.add("d-none");
    }

    if ($response.genres.length >= 1) {
      genres.innerHTML = "Genres: ";
      $response.genres.forEach($genre => {
        let span = document.createElement("span");
        span.classList.add("badge", "badge-default");
        span.appendChild(document.createTextNode($genre.name));
        genres.appendChild(span);
      });
    }

    if ($type === "movie" && $response.casts.cast.length >= 1) {
      casts.innerHTML = "Casts: ";
      $response.casts.cast.slice(0, 4).forEach($cast => {
        let span = document.createElement("span");
        span.classList.add("badge", "badge-default");
        span.appendChild(document.createTextNode($cast.name));
        casts.appendChild(span);
      });
    }

    if ($type === "movie" && $response.casts.crew.length >= 1) {
      crews.innerHTML = "Director: ";
      $response.casts.crew.slice(0, 1).forEach($crew => {
        let span = document.createElement("span");
        span.classList.add("badge", "badge-default");
        span.appendChild(document.createTextNode($crew.name));
        crews.appendChild(span);
      });
    }
  });
};

const footerLatestMovie = ($resources, $target, $template, $amount = 4) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  $resources.slice(0, $amount).forEach($resource => {
    const main = template.cloneNode(true).content,
      image = main.querySelector("img"),
      title = main.querySelector("#title");

    title.innerHTML = $resource.title;
    image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w300"));

    target.appendChild(main);
  });
};

const footerReviewMovie = ($target, $template) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  Genres.movie.forEach($genre => {
    const main = template.cloneNode(true).content,
      link = main.querySelector("a#link");

    link.appendChild(document.createTextNode($genre));
    link.setAttribute("href", `#${$genre}`);

    target.appendChild(main);
  });
};

const footerTopRatedMovie = ($resources, $target, $template, $amount = 6) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);
  $resources.slice(0, $amount).forEach($resource => {
    const main = template.cloneNode(true).content,
      image = main.querySelector("img");

    image.setAttribute("src", TheMovieDB.image($resource.poster_path, "w500"));
    image.setAttribute("alt", $resource.title);

    target.appendChild(image);
  });
};

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

Array.from(document.querySelectorAll("#movie-featured-filter-target button")).forEach($btn => $btn.addEventListener("click", () => (filterByGenre($btn.getAttribute("data-genre"), $btn, ".movie", "movie"), false)));
Array.from(document.querySelectorAll("#serie-featured-filter-target button")).forEach($btn => $btn.addEventListener("click", () => (filterByGenre($btn.getAttribute("data-genre"), $btn, ".serie", "serie"), false)));

document.getElementById("movie-featured-extra").addEventListener("click", () => showMoreOrLess("#movie-featured-extra", "#movie-featured-extra-content"));
document.getElementById("serie-featured-extra").addEventListener("click", () => showMoreOrLess("#serie-featured-extra", "#serie-featured-extra-content"));
