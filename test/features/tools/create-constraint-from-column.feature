@backlog

Feature: Create Constraint from Column
  As a Data Packager
  I want to find all unique values in a column of data
  So that I quickly define the enum constraint

  If the number of unique values in the enum exceed a limit, then error.
  Suggest enum not appropriate constraint, clean data, or create reference table and foreign key relationship.

  Scenario: Create Constraint from Column
    Given I have opened Data Curator
    And the cursor is in a column in a data tab
    When I invoke the "Create Constraint from Column" command
    Then read all the rows in that column
    And identify all the unique values
    And use the result to populate the enum constraint
