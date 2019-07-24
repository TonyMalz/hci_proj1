<script>
  import { db } from "../modules/indexeddb.js";
  import {
    studyStore,
    variableStore,
    responseStore,
    userStore
  } from "../modules/store.js";

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
            let jsn = JSON.parse(text);
            console.log("finished parsing file");
            // console.log(jsn);

            // --------------- import study into database
            // if it is not an array it only contains data of one study
            if (!(jsn instanceof Array)) {
              jsn = [jsn];
            }

            // import data of each study
            for (const importData of jsn) {
              // console.log("import study: ", importData);
              // sanity checks:
              if (!importData.hasOwnProperty("dataSchema")) {
                console.error("missing prop: dataSchema");
                return;
              }

              const study = importData.dataSchema;
              if (!study.hasOwnProperty("_id")) {
                console.error("missing prop: _id");
                return;
              }
              if (!study.hasOwnProperty("studyName")) {
                console.error("missing prop: studyName");
                return;
              }
              if (!study.hasOwnProperty("description")) {
                console.error("missing prop: description");
                return;
              }

              // insert study data into db
              if (!db) {
                console.error("missing database object");
                return;
              }

              const tx = db.transaction(
                ["Studies", "StudyVariables", "StudyTasks"],
                "readwrite"
              );
              const store = tx.objectStore("Studies");

              study.__created = new Date();
              const result = store.add(study);
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
                    event.target.source.put(study); //source -> objectStore for this event
                    result.onsuccess();
                  } else {
                    console.log("don't replace study");
                  }
                }
              };

              // if study data were successfully created: store used tasks
              result.onsuccess = () => {
                const taskStore = tx.objectStore("StudyTasks");
                const studyId = study._id;
                for (const task of study.tasks) {
                  const taskData = {
                    studyId: studyId,
                    taskId: task._id,
                    taskName: task.taskName,
                    personalData: JSON.parse(task.personalData) // cast string "false" to boolean false
                  };
                  //Update StudyTasks
                  taskStore.put(taskData);
                }

                // generate StudyVariables
                const studyVars = new Map();
                // Step 1: get variable definition of each task
                for (const task of study.tasks) {
                  // map specific questionnaire types to statistical types
                  const typeMapping = new Map([
                    ["Numeric", "scale"],
                    ["TextChoice", "nominal"],
                    ["DiscreteScale", "scale"], //FIXME: check answer labels
                    ["ContinuousScale", "scale"],
                    ["Text", "qualitative"]
                  ]);
                  for (const step of task.steps) {
                    for (const stepItem of step.stepItems) {
                      stepItem.__created = new Date();
                      stepItem.studyId = studyId;
                      stepItem.isDemographic = JSON.parse(task.personalData);
                      stepItem.measure = typeMapping.get(
                        stepItem.dataformat.type
                      );
                      stepItem.results = []; // used to hold all task results for this variable
                      studyVars.set(
                        `${studyId}|${stepItem.variableName}`,
                        stepItem
                      );
                    }
                  }
                }
                // Step 2: check if there are any results in this import that contain these variables
                if (
                  importData.hasOwnProperty("taskResults") &&
                  importData.taskResults instanceof Array
                ) {
                  for (const taskResult of importData.taskResults) {
                    for (const step of taskResult.stepResults) {
                      for (const stepItem of step.stepItemResults) {
                        const key = `${studyId}|${stepItem.variableName}`;
                        const variable = studyVars.get(key);
                        if (variable) {
                          variable.results.push({
                            value: stepItem.value,
                            date: stepItem.startDate,
                            uid: taskResult.userId,
                            taskResults: taskResult
                          });
                          studyVars.set(key, variable);
                        }
                      }
                    }
                  }
                }
                // console.log(studyVars);
                // Step 3: save variables in db
                const studyVariables = tx.objectStore("StudyVariables");
                for (const variable of studyVars.values()) {
                  studyVariables.put(variable);
                }
                // notify variable store
                variableStore.set([...$variableStore, ...studyVars.values()]);

                // notify study store (it's faster this way)
                tx.objectStore("Studies").getAll().onsuccess = e =>
                  studyStore.set(e.target.result);
              };

              // ---------- Import task results
              // check if there are any questionnaire/task results in the import file
              if (
                importData.hasOwnProperty("taskResults") &&
                importData.taskResults instanceof Array
              ) {
                const tx = db.transaction(
                  [
                    "Users",
                    "Demographics",
                    "TaskResults",
                    "StudyTasks",
                    "StudyResponses"
                  ],
                  "readwrite"
                );

                // importing questionnaire/task results
                for (const taskResult of importData.taskResults) {
                  // TODO: check if props exist
                  const { studyId, taskId, userId } = taskResult;
                  //find task to which these results belong
                  const res = tx.objectStore("StudyTasks").get(taskId);
                  res.onsuccess = e => {
                    const taskInfo = e.target.result;
                    if (taskInfo.personalData === true) {
                      // also import personal data into store Demographics
                      const store = tx.objectStore("Demographics");
                      for (const step of taskResult.stepResults) {
                        for (const stepItem of step.stepItemResults) {
                          const data = {
                            userId: userId,
                            variableName: stepItem.variableName,
                            taskId: taskId,
                            value: stepItem.value,
                            __created: new Date()
                          };
                          store.put(data); // replace existing data
                        }
                      }
                    }

                    // import results
                    const store = tx.objectStore("TaskResults");
                    for (const step of taskResult.stepResults) {
                      for (const stepItem of step.stepItemResults) {
                        const {
                          value: resultValue,
                          variableName: resultVariable,
                          startDate: resultDate
                        } = stepItem;
                        const data = {
                          studyId: studyId,
                          userId: userId,
                          taskId: taskId,
                          resultVariable,
                          resultValue,
                          resultDate,
                          stepItem, // also store original data from import file
                          __created: new Date()
                        };
                        store.add(data);
                      }
                    }
                  };

                  // update user table
                  const store = tx.objectStore("Users");
                  const user = {
                    userId: taskResult.userId,
                    studyId: studyId,
                    __created: new Date()
                  };
                  store.put(user);

                  // add response info
                  tx.objectStore("StudyResponses").put(taskResult);
                } // for each taskResult
              } // end of task result import
              //alert(`Study results for "${study.studyName}" were imported`);
              db
                .transaction("StudyResponses")
                .objectStore("StudyResponses")
                .getAll().onsuccess = e => {
                responseStore.set(e.target.result);
              };
              db
                .transaction("Users")
                .objectStore("Users")
                .getAll().onsuccess = e => {
                userStore.set(e.target.result);
              };
            }
          } catch (error) {
            console.error(`Error importing ${file.name}: `, error);
          }
        };
      }
    };
  });
</script>

<style>
  input {
    /* hide system input field since it's ugly can't be styled properly*/
    cursor: pointer;
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }
  label {
    width: 100%;
    height: 100%;
    min-height: 18ch;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-gap: 0.5rem;
    justify-items: center;
    background: tomato;
    position: relative;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    /* padding: 1rem 1.25rem; */
    border-radius: 0.25rem;
    color: white;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.25);
  }
  figure {
    align-self: flex-end;
    margin: 0;
  }
  label:hover {
    background-color: #722040;
    box-shadow: 0 5px 20px 3px rgba(0, 0, 0, 0.25);
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
  <span>Import study data</span>
</label>
