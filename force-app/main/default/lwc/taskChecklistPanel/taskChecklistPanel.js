import { LightningElement, api, track } from "lwc";
import getChecklistData from "@salesforce/apex/ChecklistController.getTasksForChecklist";
import updateChecklist from "@salesforce/apex/ChecklistController.updateTaskStatuses";

export default class TaskChecklistPanel extends LightningElement {
  //  Case record Id
  @api recordId;

  @track taskList;
  @track progress = 0;
  @track isSubmitBtnDisabled = false;

  taskIdsToUpdate = [];

  connectedCallback() {
    getChecklistData({ caseId: this.recordId })
      .then((data) => {
        this.taskList = data;
        this.calculateProgress();
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  handleCheckboxChange(event) {
    const checkbox = event.target;

    if (this.taskIdsToUpdate.includes(checkbox.name) && !checkbox.checked) {
      this.taskIdsToUpdate.pop(checkbox.name);
    } else if (
      !this.taskIdsToUpdate.includes(checkbox.name) &&
      checkbox.checked
    ) {
      this.taskIdsToUpdate.push(checkbox.name);
    }
  }

  calculateProgress() {
    let totalTasksCompleted = 0;
    for (const task of this.taskList) {
      if (task.IsCompleted__c) {
        totalTasksCompleted++;
      }
    }

    this.progress = (totalTasksCompleted / this.taskList.length) * 100;
  }

  handleUpdateTaskStatuses() {
    //  Nothing is selected, so don't do anything
    if (this.taskIdsToUpdate.length === 0) {
      return;
    }

    this.isSubmitBtnDisabled = true;

    updateChecklist({
      caseId: this.recordId,
      taskIds: JSON.stringify(this.taskIdsToUpdate),
    })
      .then((result) => {
        this.taskList = result;
        this.calculateProgress();
        //  We did the things, enable the Submit button and empty the update list
        this.isSubmitBtnDisabled = false;
        this.taskIdsToUpdate = [];
      })
      .catch((error) => {
        console.error("Error updating and fetching data:", error);
        this.isSubmitBtnDisabled = false;
      });
  }
}
