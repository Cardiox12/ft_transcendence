<!-- Please remove this file from your project -->
<template>
  <div>
    <form action="#" @submit.prevent="authenticateApi">
      <fieldset>
        <label>
          <input
            type="text"
            required
            v-model="username"
            placeholder="username"
            name="username"
            autofocus />
        </label>
        <label>
          <input
            type="password"
            required
            v-model="password"
            placeholder="password"
            name="password"
            minlength="8" />
        </label>
        <div class="form-btns">
          <input type="submit" value="connect" @click="isRegistering = false" />
          <input type="submit" value="register" @click="isRegistering = true" />
        </div>
      </fieldset>
    </form>
    <p v-if="errorMessage" style="color: var(--error-color);">{{ errorMessage }}</p>
    <p v-show="registeringValid">Account created</p>
  </div>
</template>

<script setup lang="ts">
import { Ref } from 'vue';
import { UserInfos } from '~~/classes/User.class';

const isRegistering: Ref<boolean> = ref(false);
const password: Ref<string> = ref('');
const username: Ref<string> = ref('');

const errorMessage: Ref<string> = ref('');
const registeringValid: Ref<boolean> = ref();

async function authenticateApi() {
  registeringValid.value = false
  const { $apiFetch } = useNuxtApp();
  const apiRoute = isRegistering.value ? '/auth/register' : '/auth/connect';

  try {
    const userInfos: UserInfos = await $apiFetch(apiRoute, {
      method: 'POST',
      body: {
        password: password.value,
        username: username.value
      }
    });
    errorMessage.value = '';
    password.value = '';

    if (!isRegistering.value) {
      const { $eventBus } = useNuxtApp();
      $eventBus.$emit('connect', userInfos);
    }
    registeringValid.value = isRegistering.value
  } catch (error) {
    errorMessage.value = error.data.message;
    password.value = '';
  }
}

</script>

<!-- -------------------------------------------------------------- -->

<style scoped>
  form {
    display: table;
  }

  input,
  fieldset {
    color: var(--main-color);
    border: solid var(--main-color-dark);
    border-collapse: collapse;
  }

  fieldset {
    margin: 0 auto;
    height: 10%;
    background-color: var(--background-op-10);

  }

  label {
    display: block;
    margin: 1rem;
  }

  input::placeholder {
    color: var(--main-color);
  }

  input[type="submit"]:hover {
    border-bottom: none;
    scale: 1.1;
  }

  .form-btns {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    justify-content: space-evenly;
  }
</style>
