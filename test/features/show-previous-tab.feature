Feature:  Show previous tab
  In order to quickly move between data tables
  As a Data Packager
  I want to quickly move from the current active tab to the previous tab to the left

  If you are on the left-most tab, disable the Show next tab menu option and keyboard shortcut.

  Scenario: Use the menu to show the previous tab
    Given I have opened Data Curator
    And I have opened more than one tab
    And I have not selected the left-most tab
    When the Previous Tab menu item is selected
    Then deactive the current tab
    And activate the tab to the left

  Scenario: Use a keyboard shortcut to show the previous tab
    Given I have opened Data Curator
    And I have opened more than one tab
    And I have not selected the left-most tab
    When the Previous Tab keyboard shortcut is selected
    Then deactive the current tab
    And activate the tab to the left
