<template>
    <div class="navbar">
      <a href="./index.html"
        ><img src="../../images/icon-transparent.svg" class="logo header-button" alt="Logo" draggable="false"
      /></a>
      <h1 v-cloak>{{ msg("permissions") }}</h1>
    </div>
    <div v-cloak class="main">
      <div class="permissions-block">
        <h2>{{ msg("enablePermissionsTitle") }}</h2>
        <p>{{ msg("enablePermissionsDescription") }}</p>
      </div>
      <div class="permissions-steps">
        <div>
          <button id="permissionsBtn" class="large-button">{{ msg("enableButton") }}</button>
          <p>{{ msg("enableButtonDescription") }}</p>
        </div>
        <div>
          <img alt="{{ msg('permissionsScreenAlt') }}" id="screenshot" v-bind:src="screenshotPath" />
          <p>{{ msg("clickAllowDescription") }}</p>
        </div>
      </div>
    </div>
</template>
