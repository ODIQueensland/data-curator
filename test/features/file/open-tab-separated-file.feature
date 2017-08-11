Feature: Open a Tab separated value file
  As a Data Packager
  I want to open a tab separated value (TSV) file
  So that I can describe, validate and package the data

  The data may be stored in a ".tsv", ".csv" or ".txt" file

  CSV dialect specification - http://specs.frictionlessdata.io/csv-dialect/#specification

  Use the default CSV dialect values in the specification but with 'delimiter' = '\t' to open the file and separate the values into the correct columns.

  Unresolved:
  - is it valide to store tab separated value files in ".csv"?

  Scenario: Use the menu to open an existing Tab Separated Value file
    Given I have opened Data Curator
    When I select "Open Tab Separated" from the menu
    Then a prompt, requesting the file name and location is shown
    But only files ending with a ".csv", ".tsv" or ".txt" can be selected
    Then the selected file is opened in a new data tab to the right of any other open data tabs
