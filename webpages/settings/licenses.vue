<template>
    <div class="navbar">
      <a href="./index.html"
        ><img src="../../images/icon-transparent.svg" class="logo header-button" alt="Logo" draggable="false"
      /></a>
      <h1 v-cloak>{{ msg("licenses") }}</h1>
    </div>
    <div class="main">
      <div class="licenses-block">
        <h2 id="loading">{{ msg("loading") }}</h2>
        <div class="license-container">
          <div v-cloak class="licenses-body" v-for="library of libraries">
            <h2>{{ msg("licensesForLibrary", library.name) }}</h2>
            <pre>{{ library.license }}</pre>
          </div>
        </div>
      </div>
    </div>
</template>
