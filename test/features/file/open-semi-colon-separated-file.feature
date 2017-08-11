Feature: Open a Semi-colon separated value file
  As a Data Packager
  I want to open a semi-colon separated value file
  So that I can describe, validate and package the data

  The data may be stored in a ".csv" or ".txt" file

  CSV dialect specification - http://specs.frictionlessdata.io/csv-dialect/#specification

  Use the default CSV dialect values in the specification but with 'delimiter' = ';' to open the file and separate the values into the correct columns.

  Scenario: Use the menu to open an existing semi-colon separated value file
    Given I have opened Data Curator
    When I select "Open Semi-colon Separated" from the menu
    Then a prompt, requesting the file name and location is shown
    But only files ending with a ".csv" or ".txt" can be selected
    Then the selected file is opened in a new data tab to the right of any other open data tabs
