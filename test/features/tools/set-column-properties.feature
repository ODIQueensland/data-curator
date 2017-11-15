Feature: Set Column Properties
  As a Data Packager
  I want to describe the meaning and structure of the data
  So that it can be validated and Data Consumers can understand and use it

  Column properties are defined in http://frictionlessdata.io/specs/table-schema/

  The 'name', 'type' and 'format' can be pre-populated using Guess Column Properties

  A 'name' must be entered for each column. 'name' will be defaulted from the value in the first row

  The 'title' and 'description' are optional

  Each 'type' has a 'format' of 'default' and may have a limited set of other formats.

  Each column may have one or more 'constraints' to further restrict the valid values that can be entered into a column. Constraints can vary by 'type'.

  Set Column Properties for the current column can be invoked from the menu or toolbar

  Background:
    Given I have opened Data Curator
    And I have opened a data tab
    And the cursor is in a column

  Scenario: Set Column Properties for the current column
    When I invoke the "Column Properties" command
    Then display a panel that allows me to properties for the current column
    And accept and validate column property values
    And save the values as they are entered
