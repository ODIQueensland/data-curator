Feature: Save data
  As an Data Packager
  I want to save the changes made to the data in the active data tab using the appropriate CSV dialect settings
  So that I can progressively save my work

  If available, use the CSV dialect settings in associated Table Properties.

  If these are unavailable, then use the CSV dialect specified in Preferences.

  By default the CSV dialect will be a comma separated file with defaults settings as documented in http://specs.frictionlessdata.io/csv-dialect/#specification

  The CSV dialect selected may change the file extension e.g. tab separated values files use .tsv

  Background:
    Given I have opened Data Curator
    And I have opened 1 data tab
    And I have changed the data in the active tab

  Scenario: Use the menu to save the data
    When I select "Save" from the menu
    Then save the data in the active tab using the CSV dialect settings

  Scenario: Use a keyboard shortcut to save the data
    When I use the "Save" keyboard shortcut
    Then save the data in the active tab using the CSV dialect settings
