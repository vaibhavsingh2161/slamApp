function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("text", event.target.id);
}

async function drop(event) {
  event.preventDefault();

  var taskId = event.dataTransfer.getData("text");
  const newStatus = event.target.id;
  const endpoint = event.target.classList.contains("1")
    ? "/scrumboard1/update-status"
    : "/scrumboard2/update-status";
  try {
    await fetch(endpoint, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, newStatus }),
    });

    event.target.appendChild(document.getElementById(taskId));
  } catch (err) {
    console.error(err);
  }
}

var myList = document.getElementById("todo-list");

var dropTargets = document.querySelectorAll(".drop-target");

dropTargets.forEach((dropTarget) => {
  dropTarget.addEventListener("drop", drop);
  dropTarget.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
});
