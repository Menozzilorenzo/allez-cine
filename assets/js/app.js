/////////////////////
///// VARIABLES
////////////////////

const TheMovieDB = {};
const Genres = {
  movie: [],
  serie: []
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

// TODO: Fix bug when enter not integer.
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
button.innerHTML = '<i class="fas fa-chevron-circle-up"></i>';
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

  if (document.body.scrollTop >= 220 || document.documentElement.scrollTop > 220) {
    navbar.style.opacity = 0;
  } else {
    navbar.style.opacity = 1;
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
    listMovies("movie", $response.results, "#movie-now-target", "#movie-now-template", 0, 5);
  });
});

Promises.movie.discover = TheMovieDB.request("discover/movie").then($response => {
  if (Settings.debug) console.log("Movie:Discover", $response.results);
  Promise.all([Promises.movie.genre]).then(() => {
    listMovies("movie", $response.results, "#movie-featured-target", "#movie-featured-template", 0, 18);
  });
});

Promises.movie.popular = TheMovieDB.request("movie/popular").then($response => {
  if (Settings.debug) console.log("Movie:Popular", $response.results);
  createCarousel($response.results, "#carousel-template", "#carousel-target", 3);
});

///////////////////
// REQUEST SERIES
//////////////////

Promises.serie.discover = TheMovieDB.request("discover/tv").then($response => {
  if (Settings.debug) console.log("Serie:Discover", $response.results);
  listMovies("serie", $response.results, "#serie-featured-target", "#serie-featured-template", 0, 18);
});

////////////////
// APPLICATION
///////////////

const createCarousel = ($resources, $template, $target, $amount = 10) => {
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

const listMovies = ($type, $resources, $target, $template, $index = 0, $amount = 20) => {
  let target = document.querySelector($target);
  let template = document.querySelector($template);

  $resources.slice($index, $amount).forEach($resource => {
    let main = template.cloneNode(true).content,
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

    target.appendChild(main);
  });

  template.remove();
};

const attachModal = ($id, $type) => {
  TheMovieDB.request($type === "movie" ? "movie/:id" : "tv/:id", {
    id: $id,
    params: {
      append_to_response: ["videos", "images", "casts"]
    }
  }).then($response => {
    if (Settings.debug) console.log($type === "movie" ? "Movie:Detail" : "Serie:Detail", $response);
    let modal = document.getElementById("detail-modal"),
      title = modal.querySelector(".modal-title"),
      overview = modal.querySelector(".modal-body #overview"),
      trailer = modal.querySelector("iframe#trailer"),
      release = modal.querySelector("#release"),
      casts = modal.querySelector("#casts"),
      crews = modal.querySelector("#crews"),
      genres = modal.querySelector("#genres");

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

let lastPushedSerieFilter = null;
let lastPushedMovieFilter = null;
const filterByGenre = ($genre, $btn, $selector, $type) => {
  if ($type === "movie") {
    if (lastPushedMovieFilter !== null) {
      lastPushedMovieFilter.classList.remove("btn-primary");
      lastPushedMovieFilter.classList.add("btn-light");
      lastPushedMovieFilter = null;
    }
  } else {
    if (lastPushedSerieFilter !== null) {
      lastPushedSerieFilter.classList.remove("btn-primary");
      lastPushedSerieFilter.classList.add("btn-light");
      lastPushedSerieFilter = null;
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

///////////////////
// EVENTS HANDLER
//////////////////

Array.from(document.querySelectorAll("#movie-featured-filter-target button")).forEach($btn => $btn.addEventListener("click", () => (filterByGenre($btn.getAttribute("data-genre"), $btn, ".movie", "movie"), false)));
Array.from(document.querySelectorAll("#serie-featured-filter-target button")).forEach($btn => $btn.addEventListener("click", () => (filterByGenre($btn.getAttribute("data-genre"), $btn, ".serie", "serie"), false)));