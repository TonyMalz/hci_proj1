<script>
  let name = "Test Study";
  let time = "78%";
  let participants = 27;
  let datasets = 1326;
</script>

<style>
  #info {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    grid-gap: 1em;
  }
</style>

<div id="info">
  <div>Study name: {name}</div>
  <div>Total study time elapsed: {time}</div>
  <div>Number of active participants: {participants}</div>
  <div>Datasets collected: {datasets}</div>
</div>
