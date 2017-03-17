import React, { PropTypes as pt } from 'react';
import { propTypes as reduxFormPropTypes } from 'redux-form';
import cx from 'classnames';

/**
 * Abstracted piece of the multipicker - contains the actual select element and
 * the text field that allows filtering of that list. Fires props upon selection change.
 */
class PickerControl extends React.Component {
  static propTypes = {
    options: pt.array.isRequired,
    onSubmit: pt.func.isRequired,
    titleLabel: pt.string.isRequired,
    buttonLabel: pt.string.isRequired,
    noneLabel: pt.string.isRequired,
    searchLabel: pt.string.isRequired,
    className: pt.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      // `filterText` is the user-inputted string to filter the list options by
      filterText: '',
      // `selected` is the existing options that the user currently has
      selected: [],
    };
    this.handleTextChange = ::this.handleTextChange;
    this.handleSelectUpdate = ::this.handleSelectUpdate;
    this.handleConfirmation = ::this.handleConfirmation;
    this.handleRef = ::this.handleRef;
    this.renderSelectOption = ::this.renderSelectOption;
  }

  /**
   * Collect and return an array of selected values for this PickerControl.
   *
   * @return {Array<string>}    Array of selected option values
   */
  getCurrentSelection() {
    return Array.from(this.selectRef.selectedOptions).map(option => option.value).filter(x => x);
  }

  /**
   * Given an array of options and some search text, returns an array of items that
   * contain the search text in their value/label. This is used to filter out
   * items in the <select> element based on the user's inputted search text.
   *
   * @param  {Array<{value: string, label: string }>} options Available options
   * @param  {String} search  Text to search over options with
   * @return {Array<Object>}  Array of available options that meet search criteria
   */
  getFilteredOptions(options, search) {
    let newOptions = [].concat(options);

    // There may not even be a search, so check that first.
    if (search) {
      // Lowercase-ify the search value to remove case sensitivity
      const filterValue = search.toLowerCase();

      // For each option, create a string value to search over, and then determine
      // if that value contains our search text.
      newOptions = newOptions.filter(({ value, label }) => {
        const searchValues = [value, label].join('   ').toLowerCase();
        return searchValues.indexOf(filterValue) > -1;
      });
    }

    // newOptions will either be existing options, or filtered options (if search
    // text exists)
    return newOptions;
  }

  /**
   * Gathers selected options and reports them as a comma-delineated string to
   * the parent component. This is fired when user has made a selection and then
   * decided to.. do something with it.
   *
   * @return {String} Comma-separated string of selected option values
   */
  handleConfirmation() {
    this.props.onSubmit(this.getCurrentSelection());

    // Clear the internal selection memory
    this.setState({
      selected: [],
    });

    // Clear user selection (otherwise it will remain in place, even after list
    // children are added/removed)
    this.selectRef.value = null;
  }

  /**
   * Updates internal `selected` state with currently selected options, which is
   * later used for things such as disabling the submit button.
   */
  handleSelectUpdate() {
    this.setState({
      selected: this.getCurrentSelection(),
    });
  }

  /**
   * Updates internal `filterText` state with user-inputed text value, which is
   * later used for filtering displayed options.
   *
   * @param  {Event}  event   onChange event object
   */
  handleTextChange(event) {
    this.setState({
      filterText: event.target.value,
    });
  }

  /**
   * <select>'s ref handler. Simply stores a reference to this component's select
   * element.
   *
   * @param  {Element} ref  Element for this <select>
   */
  handleRef(ref) {
    this.selectedRef = ref;
  }

  /**
   * Given an option object, renders a correlating <option> element.
   *
   * @param  {Object<{ label: string, value: string }>} option
   * @param  {any} key    Value to use for `key` prop on this element
   * @return {Element}    Compiled <option> element
   */
  renderSelectOption(option, key) {
    return (
      <option
        key={key}
        title={option.value}
        value={option.value}
      >
        {option.label}
      </option>
    );
  }

  /**
   * Returns a "no results found" or "no items selected" message. This is
   * primarily used when the user is actively filtering items, or as the general
   * 'empty list' state.
   *
   * @return {Element}  <option> element containing 'empty' message
   */
  renderEmptyMessage() {
    const {
      noneLabel,
    } = this.props;

    const {
      filterText,
    } = this.state;

    return (
      <option disabled className="option-label">
       {filterText ? `No results found for "${filterText}"` : noneLabel}
      </option>
    );
  }


  render() {
    const {
      filterText,
      selected,
    } = this.state;

    const {
      buttonLabel,
      className,
      options,
      searchLabel,
      titleLabel,
    } = this.props;

    const filteredOptions = this.getFilteredOptions(options, filterText);
    const frameClass = cx('mp-frame', className);

    return (
      <div className={frameClass}>
        {titleLabel}

        <input
          type="search"
          placeholder={searchLabel}
          onChange={this.handleTextChange}
        />

        <select
          ref={this.handleRef}
          onChange={this.handleSelectUpdate}
          multiple
        >
          { filteredOptions.map(this.renderSelectOption) }
          { !filteredOptions.length && this.renderEmptyMessage() }
        </select>

        <button
          disabled={selected.length <= 0}
          type="button"
          onClick={this.handleConfirmation}
        >
          { buttonLabel }
        </button>
      </div>
    );
  }
}


/**
 * MultiPicker component - allows user to select multiple options and group them
 * together into a separate list. Provides redux-form props (such as `onChange`)
 * to work within forms.
 */
export default class MultiPicker extends React.Component {
  static propTypes = {
    unit: pt.string.isRequired,
    options: pt.array,
    value: reduxFormPropTypes.value,
    onChange: reduxFormPropTypes.onChange,
  };

  constructor(props) {
    super(props);
    this.state = {};

    this.handleApplySelection = ::this.handleApplySelection;
    this.handleRemoveSelection = ::this.handleRemoveSelection;
  }

  /**
   * Event handler for a PickerControl that has fired its `onConfirm` prop.
   * At this point, a user has selected options in one of the pickers, and wants
   * to do something with it. In this case, they want to 'apply' the selection,
   * which essentially means 'mark it as selected and move it to the other PickerControl'.
   *
   * @param  {Array<string>}  selection   Array of selected values to apply
   */
  handleApplySelection(selection = []) {
    const {
      value = [],
    } = this.props;

    // A redux-form value can be a string or an array, but we want an array.
    const valueArray = typeof value === 'string' ? value.split(', ') : value;

    // Get a set of unique selected values from existing values and those coming in
    const uniqueSelections = new Set(valueArray.concat(selection));

    // Convert the Set of unique values into an array.
    const newEnabled = Array.from(uniqueSelections);

    // Send that value to redux-form.
    this.props.onChange(newEnabled.join(', '));
  }

  /**
   * Event handler for a PickerControl that has fired its `onConfirm` prop.
   * At this point, a user has selected options in one of the pickers, and wants
   * to do something with it. In this case, they want to 'remove' the selection,
   * which essentially means 'mark it as NOT selected and move it to the first PickerControl'.
   *
   * @param  {Array<string>}  selection   Array of selected values to remove
   */
  handleRemoveSelection(selection = []) {
    const {
      value = [],
    } = this.props;

    // A redux-form value can be a string or an array, but we want an array.
    const valueArray = typeof value === 'string' ? value.split(', ') : value;

    // New enabled selections will be those remaining after filtering de-selections.
    const newEnabled = valueArray.filter(val => selection.indexOf(val) === -1);

    // Send that value to redux-form.
    this.props.onChange(newEnabled.join(', '));
  }

  /**
   * Render
   */
  render() {
    const {
      unit = '',
      value,
      options,
    } = this.props;

    const lowercaseUnit = unit.toLowerCase();

    // `value` is the currently selected value for the component from redux-form.
    // We can compare the given `options` with the `value` to determine what has been selected
    // by the user already or not, and then populate the displayed lists accordingly.
    const availableOptions = options.filter(option => value.indexOf(option.value) === -1);
    const selectedOptions = options.filter(option => value.indexOf(option.value) !== -1);

    return (
      <div className="multipicker">
        <PickerControl
          options={availableOptions}
          className="mp-from"
          titleLabel={`Available ${unit}`}
          searchLabel={`Filter Available ${unit}`}
          onSubmit={this.handleApplySelection}
          buttonLabel={`Add ${unit}`}
          noneLabel={`No ${lowercaseUnit} available.`}
        />

        <PickerControl
          options={selectedOptions}
          className="mp-to"
          titleLabel={`Selected ${unit}`}
          searchLabel={`Filter Selected ${unit}`}
          onSubmit={this.handleRemoveSelection}
          buttonLabel={`Remove ${unit}`}
          noneLabel={`No ${lowercaseUnit} selected.`}
        />
      </div>
    );
  }
}
