import * as packageJson from '../../../../../package.json'
import { ViewPlugin } from '@remixproject/engine-web'
import { Plugin } from '@remixproject/engine';
import { RemixAITab } from '@remix-ui/remix-ai'
import React from 'react';
import { ICompletions, IModel, RemoteInferencer, IRemoteModel } from '@remix/remix-ai-core';
import { resourceUsage } from 'process';

const profile = {
  name: 'remixAI',
  displayName: 'Remix AI',
  methods: ['code_generation', 'code_completion',
    "solidity_answer", "code_explaining",
    "code_insertion", "error_explaining",
    "initialize"],
  events: [],
  icon: 'assets/img/remix-logo-blue.png',
  description: 'RemixAI provides AI services to Remix IDE.',
  kind: '',
  location: 'sidePanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/remixai.html',
  version: packageJson.version,
  maintainedBy: 'Remix'
}

export class RemixAIPlugin extends ViewPlugin {
  isOnDesktop:boolean = false
  aiIsActivated:boolean = false
  readonly remixDesktopPluginName = 'remixAID'
  remoteInferencer:RemoteInferencer = null
  isInferencing: boolean = false

  constructor(inDesktop:boolean) {
    console.log('remixAIPlugin loaded')
    super(profile)
    this.isOnDesktop = inDesktop

    // user machine dont use ressource for remote inferencing
  }

  onActivation(): void {
    if (this.isOnDesktop) {
      console.log('Activating RemixAIPlugin on desktop')
    } else {
      console.log('Activating RemixAIPlugin on browser')
      this.initialize()
    }
  }

  async initialize(model1?:IModel, model2?:IModel, remoteModel?:IRemoteModel){

    if (this.isOnDesktop) {
      const res = await this.call(this.remixDesktopPluginName, 'initializeModelBackend', false, model1, model2)
      if (res) {
        this.on(this.remixDesktopPluginName, 'onStreamResult', (value) => {
          this.call('terminal', 'log', { type: 'log', value: value })
        })

        this.on(this.remixDesktopPluginName, 'onInference', () => {
          this.isInferencing = true
        })

        this.on(this.remixDesktopPluginName, 'onInferenceDone', () => {
          this.isInferencing = false
        })
      }

    } else {
      // on browser
      console.log('Initializing RemixAIPlugin on browser')
      this.remoteInferencer = new RemoteInferencer(remoteModel?.apiUrl, remoteModel?.completionUrl)
      this.remoteInferencer.event.on('onInference', () => {
        this.isInferencing = true
      })
      this.remoteInferencer.event.on('onInferenceDone', () => {
        this.isInferencing = false
      })
    }

    this.aiIsActivated = true
    return true
  }

  async code_generation(prompt: string): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    if (this.isOnDesktop) {
      return await this.call(this.remixDesktopPluginName, 'code_generation', prompt)
    } else {
      return await this.remoteInferencer.code_generation(prompt)
    }
  }

  async code_completion(prompt: string): Promise<any> {
    if (this.isOnDesktop) {
      return await this.call(this.remixDesktopPluginName, 'code_completion', prompt)
    } else {
      return await this.remoteInferencer.code_completion(prompt)
    }
  }

  async solidity_answer(prompt: string): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: `\n\nWaiting for RemixAI answer...` })

    let result
    if (this.isOnDesktop) {
      result = await this.call(this.remixDesktopPluginName, 'solidity_answer', prompt)
    } else {
      result = await this.remoteInferencer.solidity_answer(prompt)
    }
    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result })
    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI Done" })
  }

  async code_explaining(prompt: string): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: `\n\nWaiting for RemixAI answer...` })

    let result
    if (this.isOnDesktop) {
      result = await this.call(this.remixDesktopPluginName, 'code_explaining', prompt)

    } else {
      result = await this.remoteInferencer.code_explaining(prompt)
    }
    if (result) this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result })
    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI Done" })
  }

  async error_explaining(prompt: string): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: `\n\nWaiting for RemixAI answer...` })

    let result
    if (this.isOnDesktop) {
      result = await this.call(this.remixDesktopPluginName, 'error_explaining', prompt)
    } else {
      result = await this.remoteInferencer.error_explaining(prompt)
    }
    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result })
    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI Done" })
  }

  async code_insertion(msg_pfx: string, msg_sfx: string): Promise<any> {
    if (this.isOnDesktop) {
      return await this.call(this.remixDesktopPluginName, 'code_insertion', msg_pfx, msg_sfx)
    } else {
      return await this.remoteInferencer.code_insertion(msg_pfx, msg_sfx)
    }
  }

  render() {
    return (
      <RemixAITab plugin={this}></RemixAITab>
    )
  }
}
