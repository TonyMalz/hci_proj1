<script>
  import { db } from "../modules/indexeddb.js";
  import { onMount } from "svelte";
  onMount(() => {
    const el = document.getElementById("studyImport");

    el.onchange = () => {
      for (const file of el.files) {
        //console.log(file);
        if (file.type !== "application/json") {
          console.error("invalid file type");
          continue;
        }
        // read file contents
        const reader = new FileReader();
        console.log("importing file: ", file.name);
        reader.readAsText(file);
        reader.onload = e => {
          const text = reader.result;
          console.log("file reader finished importing");
          try {
            console.log("parsing json file: ", file.name);
            const jsn = JSON.parse(text);
            console.log("finished parsing file");
            console.log(jsn);
            // import study into database

            // sanity checks:
            if (!jsn.hasOwnProperty("_id")) {
              console.error("missing prop: _id");
              return;
            }
            if (!jsn.hasOwnProperty("studyName")) {
              console.error("missing prop: studyName");
              return;
            }
            if (!jsn.hasOwnProperty("description")) {
              console.error("missing prop: description");
              return;
            }

            // insert study data into db
            if (!db) {
              console.error("missing database object");
              return;
            }

            let tx = db.transaction(["Studies", "StudyVariables"], "readwrite");
            let storeName = "Studies";
            let store = tx.objectStore(storeName);

            jsn.$created = new Date();
            let result = store.add(jsn); // put replaces existing items in the db
            result.onerror = event => {
              // ConstraintError occurs when an object with the same id already exists
              if (result.error.name == "ConstraintError") {
                if (
                  confirm(
                    "This study already exists, do you want to replace it?"
                  )
                ) {
                  console.log("replace study");
                  event.preventDefault(); // don't abort the transaction
                  event.stopPropagation();
                  event.target.source.put(jsn); //source holds objectStore for this event
                  result.onsuccess();
                } else {
                  console.log("don't replace study");
                }
              }
            };
            result.onsuccess = () => {
              storeName = "StudyVariables";
              store = tx.objectStore(storeName);

              const stId = jsn._id;
              for (const task of jsn.tasks) {
                for (const step of task.steps) {
                  for (const stepItem of step.stepItems) {
                    stepItem.$created = new Date();
                    stepItem.studyId = stId;
                    store.put(stepItem);
                  }
                }
              }
              alert(`Study "${jsn.studyName}" was successfully imported`);
            };
          } catch (error) {
            console.error(`Error parsing ${file.name}: `, error);
          }
        };
      }
    };
  });
</script>

<style>
  input {
    cursor: pointer;
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }
  label {
    background: tomato;
    height: 15ch;
    text-align: center;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    overflow: hidden;
    padding: 1rem 1.25rem;
    border-radius: 4px;
    color: white;
  }
  label:hover {
    background-color: #722040;
  }
</style>

<input id="studyImport" type="file" multiple accept="application/json" />
<label for="studyImport">
  <figure>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2em"
      height="1.8em"
      viewBox="0 0 20 17">
      <path
        fill="white"
        d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3
        11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8
        2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6
        1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4
        1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z" />
    </svg>
  </figure>
    Upload new study
</label>
