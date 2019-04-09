import { FetchResponse } from "./fetch_response"
import { FormSubmission } from "./form_submission"
import { Location } from "./location"
import { uuid } from "./util"
import { Visit, VisitDelegate, VisitOptions } from "./visit"

export type NavigatorDelegate = VisitDelegate

export enum NavigationTarget {
  background,
  foreground,
  modal
}

export type NavigationOptions = VisitOptions & {
  target: NavigationTarget
}

export class Navigator {
  readonly delegate: NavigatorDelegate
  foregroundFormSubmission?: FormSubmission
  backgroundFormSubmissions: Set<FormSubmission> = new Set
  currentVisit?: Visit

  constructor(delegate: NavigatorDelegate) {
    this.delegate = delegate
  }

  visit(location: Location, restorationIdentifier: string, options: Partial<NavigationOptions> = {}) {
    this.startVisit(location, restorationIdentifier, options)
  }

  submit(form: HTMLFormElement, options: Partial<NavigationOptions> = {}) {
    const formSubmission = new FormSubmission(this, form)

    if (options.target == NavigationTarget.background) {
      this.backgroundFormSubmissions.add(formSubmission)
    } else {
      this.stop()
      this.foregroundFormSubmission = formSubmission
    }

    formSubmission.start()
  }

  stop() {
    if (this.foregroundFormSubmission) {
      this.foregroundFormSubmission.stop()
      delete this.foregroundFormSubmission
    }

    if (this.currentVisit) {
      this.currentVisit.cancel()
      delete this.currentVisit
    }
  }

  reload() {

  }

  goBack() {

  }

  get adapter() {
    return this.delegate.adapter
  }

  get view() {
    return this.delegate.view
  }

  get history() {
    return this.delegate.history
  }

  // Form submission delegate

  formSubmissionStarted(formSubmission: FormSubmission) {

  }

  async formSubmissionSucceededWithResponse(formSubmission: FormSubmission, fetchResponse: FetchResponse) {
    if (formSubmission == this.foregroundFormSubmission) {
      const responseHTML = await fetchResponse.responseHTML
      if (responseHTML) {
        const visitOptions = { response: { responseHTML } }
        this.startVisit(fetchResponse.location, uuid(), visitOptions)
      }
    }
  }

  formSubmissionFailedWithResponse(formSubmission: FormSubmission, fetchResponse: FetchResponse) {
    console.error("Form submission failed:", formSubmission, fetchResponse)
  }

  formSubmissionErrored(formSubmission: FormSubmission, error: Error) {
    console.error("Form submission failed:", formSubmission, error)
  }

  formSubmissionFinished(formSubmission: FormSubmission) {

  }

  // Visit delegate

  visitStarted(visit: Visit) {
    this.delegate.visitStarted(visit)
  }

  visitCompleted(visit: Visit) {
    this.delegate.visitCompleted(visit)
  }

  // Visits

  startVisit(location: Location, restorationIdentifier: string, options: Partial<VisitOptions> = {}) {
    this.stop()
    this.currentVisit = new Visit(this, location, restorationIdentifier, { ...options, referrer: this.location })
    this.currentVisit.start()
  }

  get location() {
    return this.history.location
  }
}