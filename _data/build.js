// Changes on every build, which gives the service worker a fresh cache name.
export default {
  time: new Date().toISOString(),
  stamp: Date.now().toString(36),
};
