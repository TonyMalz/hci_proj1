<script>
  import { onMount } from "svelte";
  onMount(() => {
    const el = document.getElementById("files");

    el.onchange = () => {
      for (const file of el.files) {
        console.log(file);
        if (file.type !== "application/json") {
          console.error("invalid file type");
          continue;
        }
        // read file contents
        const reader = new FileReader();
        reader.onload = e => {
          const text = reader.result;
          console.log("file reader finished");
          const jsn = JSON.parse(text);
          console.log(jsn);
        };
        reader.readAsText(file);
      }
    };
  });
</script>

<input type="file" id="files" multiple accept="application/json" />
