/**
 *
 */
public with sharing class TaskChecklistPanelController {
    public class TaskChecklistPanelControllerException extends Exception {
    }

    /**
     *
     */
    public static List<Task> getTasksByCaseId(Id caseId) {
        Case caseInfo = [
            SELECT
                Id,
                (
                    SELECT Id, Subject, IsCompleted__c, CompletedDateTime, Type
                    FROM Tasks
                    WHERE Type = 'Checklist_Item'
                    ORDER BY Subject ASC
                )
            FROM Case
            WHERE Id = :caseId
        ];

        return caseInfo.Tasks;
    }

    /**
     *
     */
    public static List<Task> updateTaskStatusById(
        String caseId,
        Set<String> idsToUpdate
    ) {
        List<Task> toUpdate = new List<Task>();
        for (String taskId : idsToUpdate) {
            toUpdate.add(new Task(Id = taskId, Status = 'Completed'));
        }

        List<Database.SaveResult> updateResults = Database.update(
            toUpdate,
            true
        );

        String errorString = '';
        Boolean hasErrors = false;
        for (Database.SaveResult sr : updateResults) {
            if (!sr.isSuccess()) {
                hasErrors = true;
                for (Database.Error de : sr.getErrors()) {
                    errorString += de.getMessage() + '\n';
                }
            }
        }

        if (hasErrors) {
            throw new TaskChecklistPanelControllerException(errorString);
        }

        return getTasksByCaseId(caseId);
    }
}
