<!-- sub division page:                     -->
<!-- 3 column:                              -->
<!-- usersList | This user profile |  chat  -->

<template>
  <div class="home-page">
    <div style="width: 15%">
      <userpageUserList />
    </div>
    <div style="width: 60%; border: solid; border-color: blue">
      <slot />
    </div>
    <div style="width: 35%; border: solid; border-color: orange"></div>
  </div>
</template>

<!-- -------------------------------------------------------------- -->

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
  position: absolute;
  display: flex;
  justify-content: space-around;
  top: 1%;
}

</style>
